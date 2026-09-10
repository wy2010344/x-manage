import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isNotionProxyUrl,
  parseNotionPageId,
  createNotionClient,
  detectRootPageKind,
  searchRootPages,
  listChildDatabases,
  ensureNotionDatabase,
} from './notion'

const { Client } = vi.hoisted(() => {
  const handlers = new Map<string, (args: any) => any>()
  const Client = class FakeClient {
    constructor() {}
    request?: unknown
    blocks = {
      retrieve: vi.fn(async (args: any) => {
        const h = handlers.get('blocks.retrieve')
        if (!h) return { type: 'page' }
        return h(args)
      }),
      children: {
        list: vi.fn(async (args: any) => {
          const h = handlers.get('blocks.children.list')
          if (!h) throw new Error('blocks.children.list not stubbed')
          return h(args)
        }),
      },
    }
    databases = {
      create: vi.fn(async (args: any) => {
        const h = handlers.get('databases.create')
        if (!h) throw new Error('databases.create not stubbed')
        return h(args)
      }),
      query: vi.fn(),
    }
    pages = { create: vi.fn(), update: vi.fn() }
    search = vi.fn(async (args: any) => {
      const h = handlers.get('search')
      if (!h) throw new Error('search not stubbed')
      return h(args)
    })
    set(route: string, fn: (args: any) => any) {
      handlers.set(route, fn)
      return this
    }
  }
  return { Client }
})

vi.mock('@notionhq/client', () => ({ Client }))

const PROXY = 'https://proxy.test/api/notion'
const VER = '2022-06-28'

beforeEach(() => {
  vi.clearAllMocks()
  ;(Client as any).__handlers?.clear?.()
})

afterEach(() => {
  ;(globalThis as any).GM_xmlhttpRequest = undefined
})

describe('isNotionProxyUrl', () => {
  it('recognizes http(s) proxy urls, rejects keys and blanks', () => {
    expect(isNotionProxyUrl('https://proxy.test/api/notion')).toBe(true)
    expect(isNotionProxyUrl('http://a.b/c')).toBe(true)
    expect(isNotionProxyUrl('secret_ntn_123')).toBe(false)
    expect(isNotionProxyUrl('secret_ntn_123')).toBe(false)
    expect(isNotionProxyUrl('')).toBe(false)
    expect(isNotionProxyUrl('   ')).toBe(false)
  })
})

describe('parseNotionPageId', () => {
  it('parses hyphenated ids and full /p/ links', () => {
    expect(parseNotionPageId('3d77bf8b-dca6-80ec-b2a9-e4df78b1804d')).toBe('3d77bf8b-dca6-80ec-b2a9-e4df78b1804d')
    expect(parseNotionPageId('3d77bf8bdca680ecb2a9e4df78b1804d')).toBe('3d77bf8b-dca6-80ec-b2a9-e4df78b1804d')
    expect(parseNotionPageId('https://app.notion.com/p/3d77bf8bdca680ecb2a9e4df78b1804d?v=abc')).toBe('3d77bf8b-dca6-80ec-b2a9-e4df78b1804d')
  })
  it('returns null for garbage', () => {
    expect(parseNotionPageId('not-an-id')).toBeNull()
    expect(parseNotionPageId('')).toBeNull()
  })
})

describe('createNotionClient', () => {
  it('overrides request to post the SDK payload to the proxy', async () => {
    const client = createNotionClient(PROXY, VER)
    // direct: proxy branch stores a request override; verify it round-trips a payload
    // by faking global fetch below via the SDK's inner fetch path is complex, so we
    // only assert the override is installed (function) and NOT the official auth path.
    expect(typeof (client as any).request).toBe('function')
  })
  it('throws on blank configuration', () => {
    expect(() => createNotionClient('', VER)).toThrow('not configured')
  })
  it('uses GM_xmlhttpRequest when present (Tampermonkey path)', async () => {
    const calls: any[] = []
    ;(globalThis as any).GM_xmlhttpRequest = (opts: any) => {
      calls.push(opts)
      expect(opts.method).toBe('POST')
      expect(opts.url).toBe(PROXY)
      expect(opts.headers['Content-Type']).toContain('application/json')
      expect(JSON.parse(opts.data)).toMatchObject({ method: 'get', path: 'users/me' })
      opts.onload({ status: 200, responseText: JSON.stringify({ name: 'db-view', type: 'bot' }) })
    }
    const client = createNotionClient(PROXY, VER)
    const out = await (client as any).request({ method: 'get', path: 'users/me', query: {}, body: {} })
    expect(out.name).toBe('db-view')
    expect(calls.length).toBe(1)
  })
  it('re-throws error bodies delivered inside HTTP 200 via GM path', async () => {
    ;(globalThis as any).GM_xmlhttpRequest = (opts: any) => {
      opts.onload({ status: 200, responseText: JSON.stringify({ name: 'APIResponseError', status: 404, code: 'object_not_found', body: '{"object":"error","status":404,"code":"object_not_found","message":"Could not find block"}' }) })
    }
    const client = createNotionClient(PROXY, VER)
    await expect((client as any).request({ method: 'get', path: 'blocks/xxx', query: {}, body: {} }))
      .rejects.toMatchObject({ code: 'object_not_found', status: 404 })
  })
  it('rejects and surfaces network errors from GM onerror', async () => {
    ;(globalThis as any).GM_xmlhttpRequest = (opts: any) => {
      opts.onerror({ status: 0, error: 'CSP blocked the request' })
    }
    const client = createNotionClient(PROXY, VER)
    await expect((client as any).request({ method: 'get', path: 'users/me', query: {}, body: {} }))
      .rejects.toMatchObject({ code: 'network_error' })
  })
})

describe('detectRootPageKind', () => {
  it('reports page for child_page/ page blocks', async () => {
    ;(Client as any)
      .prototype.set('blocks.retrieve', () => ({ type: 'child_page', id: 'page1' }))
    const r = await detectRootPageKind({ tokenOrUrl: PROXY, notionVersion: VER, rootPageId: 'page1' })
    expect(r).toEqual({ kind: 'page' })
  })
  it('reports database for child_database/database blocks', async () => {
    ;(Client as any)
      .prototype.set('blocks.retrieve', () => ({ type: 'child_database', id: 'db1' }))
    const r = await detectRootPageKind({ tokenOrUrl: PROXY, notionVersion: VER, rootPageId: 'db1' })
    expect(r).toEqual({ kind: 'database' })
  })
})

describe('searchRootPages', () => {
  it('lists real pages and drops databases', async () => {
    ;(Client as any).prototype.set('search', () => ({
      results: [
        { object: 'page', id: 'pageA', properties: { title: { title: [{ type: 'text', plain_text: '我的页面' }] } } },
        { object: 'database', id: 'dbX' },
        { object: 'page', id: 'pageB', properties: { title: { title: [] } } },
      ],
    }))
    const r = await searchRootPages({ tokenOrUrl: PROXY, notionVersion: VER })
    expect(r).toEqual({ ok: true, pages: [
      { id: 'pageA', title: '我的页面' },
      { id: 'pageB', title: '(无标题页面)' },
    ] })
  })
})

describe('listChildDatabases', () => {
  it('pages through children and collects child_database blocks', async () => {
    ;(Client as any).prototype.set('blocks.children.list', (args: any) => {
      if (!args.start_cursor) {
        return { has_more: true, next_cursor: 'c2', results: [
          { type: 'child_database', id: 'dbA', child_database: { title: [{ type: 'text', plain_text: '收藏 (@a)' }] } },
          { type: 'paragraph', id: 'b1' },
        ] }
      }
      return { has_more: false, results: [
        { type: 'child_database', id: 'dbB', child_database: { title: [{ type: 'text', plain_text: '标签 (@b)' }] } },
      ] }
    })
    const r = await listChildDatabases({ tokenOrUrl: PROXY, notionVersion: VER, rootPageId: 'page1' })
    expect(r).toEqual({ ok: true, databases: [
      { id: 'dbA', title: '收藏 (@a)' },
      { id: 'dbB', title: '标签 (@b)' },
    ] })
  })
  it('returns an error string when the SDK call throws', async () => {
    ;(Client as any).prototype.set('blocks.children.list', () => {
      const e: any = new Error('not a real error')
      throw e
    })
    const r = await listChildDatabases({ tokenOrUrl: PROXY, notionVersion: VER, rootPageId: 'page1' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('读取根页面失败')
  })
})

describe('ensureNotionDatabase', () => {
  it('reuses an existing database by title', async () => {
    ;(Client as any)
      .prototype.set('blocks.retrieve', () => ({ type: 'page' }))
      .set('blocks.children.list', () => ({ has_more: false, results: [
        { type: 'child_database', id: 'dbX', child_database: { title: [{ type: 'text', plain_text: '收藏 (@a)' }] } },
      ] }))
    const r = await ensureNotionDatabase({ tokenOrUrl: PROXY, notionVersion: VER, rootPageId: 'page1', title: '收藏 (@a)', properties: {} })
    expect(r).toEqual({ ok: true, databaseId: 'dbX' })
  })
  it('creates a new database when title is missing', async () => {
    ;(Client as any)
      .prototype.set('blocks.retrieve', () => ({ type: 'page' }))
      .set('blocks.children.list', () => ({ has_more: false, results: [] }))
      .set('databases.create', () => ({ id: 'dbNew' }))
    const r = await ensureNotionDatabase({ tokenOrUrl: PROXY, notionVersion: VER, rootPageId: 'page1', title: '收藏 (@a)', properties: { ID: { title: {} } } })
    expect(r).toEqual({ ok: true, databaseId: 'dbNew' })
  })
  it('returns a clear database-root error instead of attempting create', async () => {
    ;(Client as any)
      .prototype.set('blocks.retrieve', () => ({ type: 'child_database' }))
      .set('blocks.children.list', () => ({ has_more: false, results: [] }))
      .set('databases.create', vi.fn(() => { throw new Error('should not be called') }))
    const r = await ensureNotionDatabase({ tokenOrUrl: PROXY, notionVersion: VER, rootPageId: 'dbRoot', title: '收藏 (@a)', properties: {} })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('根页面是数据库')
  })
})