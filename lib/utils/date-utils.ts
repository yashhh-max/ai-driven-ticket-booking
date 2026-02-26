export function formatExpiryDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${year}`
}

export function isCardExpired(month: number, year: number): boolean {
  const now = new Date()
  const expiry = new Date(year, month, 0)
  return now > expiry
}
