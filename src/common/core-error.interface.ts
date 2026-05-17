import { ErrorCode } from "./error-code"

export interface CoreError {
  success: boolean,
  code: typeof ErrorCode,
  message: string,
}