import { generateSecret, generateSync } from 'otplib'

export function generateTOTPSecret(): string {
  return generateSecret()
}

export function generateTOTPToken(secret: string): string {
  return generateSync({ secret })
}
