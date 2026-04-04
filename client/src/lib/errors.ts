import axios from 'axios'

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (typeof error.message === 'string' && error.message.trim()) return error.message
  }

  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

