import { ApiError } from '@/api/types/api.types'

/**
 * Error Utility Functions
 *
 * Centralized utilities for handling API errors across the application.
 * Supports both single string and array detail formats from backend.
 * Works with your axios setup and clean API types.
 */

/**
 * Helper function to normalize detail messages
 * Converts both string and array formats to a single string
 * @param detail - Error detail from API (string, array, or undefined)
 * @returns Normalized error message string
 */
export const normalizeDetailMessage = (detail: string | string[] | undefined): string => {
  if (!detail) return ''
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.join(', ')
  return ''
}

/**
 * Helper function to check if error has detail
 * @param error - ApiError object
 * @returns Boolean indicating if error has detail message
 */
export const hasErrorDetail = (error: ApiError): boolean => {
  return !!error.response?.data?.detail
}

/**
 * Helper function to get error detail message
 * @param error - ApiError object
 * @returns Formatted error message string
 */
export const getErrorDetail = (error: ApiError): string => {
  const detail = error.response?.data?.detail
  return normalizeDetailMessage(detail)
}

/**
 * Helper function to get error message with fallback
 * Checks detail, then message, then error.message, then fallback
 * @param error - ApiError object
 * @param fallbackMessage - Default message if no detail found
 * @returns Error message with fallback
 */
export const getErrorMessage = (error: ApiError, fallbackMessage = 'An error occurred'): string => {
  const detailMessage = getErrorDetail(error)
  const responseMessage = error.response?.data?.message
  return detailMessage || responseMessage || error.message || fallbackMessage
}

/**
 * Helper function to check if error is authentication related
 * @param error - ApiError object
 * @returns Boolean indicating if error is 401 Unauthorized
 */
export const isAuthError = (error: ApiError): boolean => {
  return error.response?.status === 401
}

/**
 * Helper function to check if error is validation related
 * @param error - ApiError object
 * @returns Boolean indicating if error is 400 Bad Request
 */
export const isValidationError = (error: ApiError): boolean => {
  return error.response?.status === 400
}

/**
 * Helper function to check if error is server related
 * @param error - ApiError object
 * @returns Boolean indicating if error is 5xx Server Error
 */
export const isServerError = (error: ApiError): boolean => {
  const status = error.response?.status
  return !!(status && status >= 500 && status < 600)
}

/**
 * Helper function to check if error is network related
 * @param error - ApiError object
 * @returns Boolean indicating if error has no response (network issue)
 */
export const isNetworkError = (error: ApiError): boolean => {
  return !error.response
}

/**
 * Helper function to get HTTP status code from error
 * @param error - ApiError object
 * @returns HTTP status code or undefined
 */
export const getErrorStatus = (error: ApiError): number | undefined => {
  return error.response?.status
}

/**
 * Helper function to get all validation errors as an object
 * @param error - ApiError object
 * @returns Object containing field-specific error messages
 */
export const getValidationErrors = (error: ApiError): Record<string, string[]> => {
  return error.response?.data?.errors ?? {}
}

/**
 * Helper function to format error for user display
 * Returns backend detail message for most errors, fallback for others
 * Preserves useful backend and network error messages
 *
 * @param error - ApiError object
 * @param fallbackMessage - Fallback message if no detail found
 * @returns Error message for display
 */
export const formatErrorForUser = (
  error: ApiError,
  fallbackMessage = 'Something went wrong. Please try again.'
): string => {
  // For any error with detail from backend, just show it
  // This covers auth (401), validation (400), and other API errors
  const detail = getErrorDetail(error)
  if (detail) {
    return detail
  }

  // For errors without detail, try message then fallback
  const responseMessage = error.response?.data?.message
  return responseMessage ?? error.message ?? fallbackMessage
}
