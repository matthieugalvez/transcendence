import { FastifyReply } from 'fastify'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  details?: Array<{ field: string, message: string }>
  timestamp?: string
}

export class ResponseUtils {
  /**
   * Send a successful response
   */
  static success<T>(
    reply: FastifyReply,
    data?: T,
    message?: string,
    statusCode: number = 200
  ) {
    return reply.code(statusCode).send({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    } as ApiResponse<T>)
  }

  /**
   * Send a created response (201)
   */
  static created<T>(reply: FastifyReply, data?: T, message?: string) {
    return this.success(reply, data, message, 201)
  }

  /**
   * Send an error response
   */
  static error(
    reply: FastifyReply,
    error: string,
    statusCode: number = 500,
    details?: Array<{ field: string, message: string }>
  ) {
    return reply.code(statusCode).send({
      success: false,
      error,
      details,
      timestamp: new Date().toISOString()
    } as ApiResponse)
  }

  /**
   * Send a bad request response (400)
   */
  static badRequest(
    reply: FastifyReply,
    error: string = 'Bad Request',
    details?: Array<{ field: string, message: string }>
  ) {
    return this.error(reply, error, 400, details)
  }

  /**
   * Send an unauthorized response (401)
   */
  static unauthorized(reply: FastifyReply, error: string = 'Unauthorized') {
    return this.error(reply, error, 401)
  }

  /**
   * Send a forbidden response (403)
   */
  static forbidden(reply: FastifyReply, error: string = 'Forbidden') {
    return this.error(reply, error, 403)
  }

  /**
   * Send a not found response (404)
   */
  static notFound(reply: FastifyReply, error: string = 'Not Found') {
    return this.error(reply, error, 404)
  }

  /**
   * Send a conflict response (409)
   */
  static conflict(reply: FastifyReply, error: string = 'Conflict') {
    return this.error(reply, error, 409)
  }

  /**
   * Send a validation error response (400)
   */
  static validationError(
    reply: FastifyReply,
    details: Array<{ field: string, message: string }>,
    error: string = 'Validation failed'
  ) {
    return this.badRequest(reply, error, details)
  }

  /**
   * Send an internal server error response (500)
   */
  static internalError(reply: FastifyReply, error: string = 'Internal Server Error') {
    return this.error(reply, error, 500)
  }
}

// Export default as Send for backwards compatibility
export default ResponseUtils
export const Send = ResponseUtils