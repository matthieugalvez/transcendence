import { FastifyRequest, FastifyReply } from "fastify";
import { ZodError, ZodSchema } from "zod";
import { ResponseUtils as Send } from '../utils/response.utils.js'

class ValidationMiddleware {

	// En gros parser pour Le Username/Mdp
	static validateBody(schema: ZodSchema) {
		return async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				schema.parse(request.body);
			} catch (error) {
				if (error instanceof ZodError) {
					const details = error.errors.map(err => ({
						field: err.path.join('.'),
						message: err.message,
						code: err.code
					}));

					// Create a more descriptive error message
					const errorMessage = details.map(detail => `${detail.field}: ${detail.message}`).join(', ');

					console.log('Validation error details:', details); // Debug log
					console.log('Validation error message:', errorMessage); // Debug log

					return Send.validationError(reply, details, errorMessage);
				}

				console.error('Validation middleware error:', error);
				return Send.badRequest(reply, 'Invalid request data')
			}
		};
	}
}

export default ValidationMiddleware;