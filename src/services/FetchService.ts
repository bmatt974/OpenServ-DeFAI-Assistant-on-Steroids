import { z } from 'zod'
import axios, { AxiosInstance } from 'axios'

export const FetchService = (
  auth?: {
    type: 'bearer' | 'basic' | 'apiKey'
    token?: string
    username?: string
    password?: string
    apiKey?: string
    apiKeyHeader?: string
  },
  options?: { timeout?: number; baseURL?: string }
): AxiosInstance => {
  const headers: Record<string, string> = {
    'X-Custom-Header': 'OpenServ agent'
  }

  if (auth) {
    switch (auth.type) {
      case 'bearer':
        if (auth.token) headers.Authorization = `Bearer ${auth.token}`
        break
      case 'basic':
        if (auth.username && auth.password) {
          headers.Authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
        }
        break
      case 'apiKey':
        if (auth.apiKey && auth.apiKeyHeader) {
          headers[auth.apiKeyHeader] = auth.apiKey
        }
        break
    }
  }

  const axiosConfig: Record<string, any> = {
    timeout: options?.timeout ?? 5000,
    headers
  }

  if (options?.baseURL) {
    axiosConfig.baseURL = options.baseURL
  }

  return axios.create(axiosConfig)
}

export const formatFetchError = (error: unknown) => {
  let message = 'Unexpected error'
  let status = 500
  let code = 'UNKNOWN_ERROR'

  if (axios.isAxiosError(error)) {
    console.log('code : ', error.code)
    message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      'Unexpected error'

    status = error.response?.status ?? 500
    code = error.code ?? 'UNKNOWN_ERROR'
  } else if (error instanceof Error) {
    message = error.message
  }

  return { message, status, code }
}
