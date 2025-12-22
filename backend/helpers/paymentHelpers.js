export const normalizeCurrency = (value) => {
  if (!value || typeof value !== 'string') return null
  return value.trim().toUpperCase()
}
