/**
 * API Error Response - The actual response body structure from your backend
 * This is what your backend API returns in the response body when there's an error
 */
export interface ApiErrorResponse {
  detail?: string | string[] // Handle both: "error message" or ["error1", "error2"]
  message?: string
  errors?: Record<string, string[]>
  [key: string]: string | number | boolean | null | undefined | string[] | Record<string, string[]>
}

/**
 * API Error - The axios error object structure
 * This is what gets thrown in catch blocks when API calls fail
 */
export interface ApiError {
  response?: {
    status?: number
    data?: ApiErrorResponse
    statusText?: string
  }
  message?: string
  code?: string
  name?: string
}

/**
 * Standard API success response from your backend
 * Use this when your backend returns a standardized success format
 */
export interface ApiSuccessResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}
