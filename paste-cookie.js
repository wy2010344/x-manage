var cookieString =
  'guest_id=v1%3A177841362685700027; __cuid=0277bbe0f961456589751deb3d9fc236; g_state={"i_l":0,"i_ll":1778413881994,"i_e":{"enable_itp_optimization":0},"i_et":1778413663551}; kdt=egSNiiRznZUaBhRpedWozftun5qCo4wblX65vuA2; auth_token=92e6f7af6203122839f9daaea4bd9590628ac6a6; ct0=72386fd67ed24ffda58697860f404b5ca49e0286a3a970d9b33a39d1b47412c705e7f1c1fe01753a1455b9cf933c8ffcba1ef25a082585ff68697e9d106471e5ded45141d3587a9dcbec63b63819b8a2; twid=u%3D1827653796698501120; lang=en; __cuid=0277bbe0f961456589751deb3d9fc236; guest_id_marketing=v1%3A177841362685700027; guest_id_ads=v1%3A177841362685700027; personalization_id="v1_bJT3q6fjYvsnvrF29jnbQg=="; __cf_bm=Qf9J8kYHdCHhoQxWhfjGJfrQC_BPebG7OWZIirBKY_c-1782214786.050018-1.0.1.1-FyH9lMK00Ss1Vl6u7X5lbhX_GXXXjMyLj.admKkxvPyyEeJ0lx9ZWUUOa7xK98Bgiyi7IUwi9Uj9xduzjWk99pClSSkhaeDmXvOLqM0GlMU9igke.hQDpeb5kGBC4OgP'

cookieString.split(';').forEach((cookie) => {
  const parts = cookie.split('=')
  const name = parts[0].trim()
  const value = parts.slice(1).join('=').trim()
  // 强制写入本地存储作为备用，部分核心Token需要手动补入
  document.cookie = `${name}=${value}; path=/; domain=.x.com; Secure; SameSite=Lax`
})
console.log('Cookie 写入尝试完成，请刷新页面！')
