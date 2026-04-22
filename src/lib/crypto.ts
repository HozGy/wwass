// Simple encryption for citizen_id (in production, use proper encryption library)
export function encrypt(text: string): string {
  // This is a simple encoding for demo purposes
  // In production, use proper encryption like crypto-js or Web Crypto API
  const encoded = btoa(text)
  return encoded
}

export function decrypt(encoded: string): string {
  try {
    return atob(encoded)
  } catch {
    return encoded
  }
}
