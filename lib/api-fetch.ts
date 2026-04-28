export const API_TOAST_HEADER = 'x-api-toast'

export const silentApiRequest = {
  headers: {
    [API_TOAST_HEADER]: 'silent',
  },
} satisfies RequestInit
