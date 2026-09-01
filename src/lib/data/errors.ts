export class AppError extends Error {
  readonly code: string

  constructor(message: string, code = 'app_error') {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export function toUserMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AppError) return error.message
  if (error instanceof Error && error.message) {
    const message = error.message.toLowerCase()
    if (message.includes('invalid login') || message.includes('invalid credentials')) {
      return 'Email or password is incorrect.'
    }
    if (message.includes('already registered') || message.includes('already exists')) {
      return 'An account with this email already exists.'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Check your connection and try again.'
    }
    if (message.includes('jwt') || message.includes('session')) {
      return 'Your session expired. Please sign in again.'
    }
    return error.message
  }
  return fallback
}
