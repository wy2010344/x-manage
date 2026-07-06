interface Props {
  message: string | null
}

export function Toast({ message }: Props) {
  if (!message) return null
  return <div className="x-manage-toast">{message}</div>
}
