import type { ErrorCode } from "./error-code"

export interface CoreResponse<T> {
  success: boolean,
  statusCode?: keyof typeof ErrorCode | 'SC_000',
  data: T,
  message: string,
}