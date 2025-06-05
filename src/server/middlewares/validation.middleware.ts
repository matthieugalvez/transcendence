import { FastifyRequest, FastifyReply } from "fastify";
import { ZodError, ZodSchema } from "zod";

class ValidationMiddleware {
  static validateBody(schema: ZodSchema) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        schema.parse(request.body);
        // No need to return anything - middleware should just continue
      } catch (error) {
        if (error instanceof ZodError) {
          // Format Zod errors
          const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }));

          return reply.code(400).send({
            success: false,
            error: 'Validation failed',
            details: errors
          });
        }

        console.error('Validation middleware error:', error);
        return reply.code(400).send({
          success: false,
          error: 'Invalid request data'
        });
      }
    };
  }
}

export default ValidationMiddleware;