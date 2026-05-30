export function formatUnixTimestamp(value: bigint) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(Number(value) * 1000));
}

export function formatUnixDate(value: bigint) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(Number(value) * 1000));
}
