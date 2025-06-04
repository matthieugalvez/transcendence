import { FastifyRequest, FastifyReply } from "fastify";
import { ZodError, ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Validate the request body
            schema.parse(request.body);
            // Continue to the next handler
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