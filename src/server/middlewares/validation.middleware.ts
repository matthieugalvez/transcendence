import { FastifyRequest, FastifyReply } from "fastify";
import { ZodError, ZodSchema } from "zod";

class ValidationMiddleware {
static  validateBody(schema: ZodSchema) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            schema.parse(request.body);
            return;
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod errors
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return reply.code(400).send({
                    success: false,
                    error: errors,
                    details: errors
                });
            }

            return reply.code(400).send({
                success: false,
                error: 'Invalid request data'
            });
        }
    };
}
}

export default ValidationMiddleware;