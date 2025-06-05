import { FastifyRequest, FastifyReply } from "fastify";
import { ZodError, ZodSchema } from "zod";
import { ResponseUtils as Send } from '../utils/response.utils'

class ValidationMiddleware {
  static validateBody(schema: ZodSchema) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        schema.parse(request.body);
        // Continue to next handler
      } catch (error) {
        if (error instanceof ZodError) {
          const details = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }));

          return Send.validationError(reply, details)
        }

        console.error('Validation middleware error:', error);
        return Send.badRequest(reply, 'Invalid request data')
      }
    };
  }
}

export default ValidationMiddleware;