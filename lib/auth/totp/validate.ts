import { verifySync } from 'otplib'

// Accept ±1 window (30s each side) for clock drift
export function validateTOTPToken(token: string, secret: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = verifySync({ token, secret, window: 1 } as any)
    return (result as any).valid === true
  } catch {
    return false
  }
}
