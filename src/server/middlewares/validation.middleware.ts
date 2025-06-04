import Send from "@utils/response.utils";
import { FastifyRequest, FastifyReply } from "fastify";
import { ZodError, ZodSchema } from "zod";

class ValidationMiddleware {
    static validateBody(schema: ZodSchema) {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                schema.parse(request.body);
                // In Fastify, we don't call next() - just return to continue
                return;
            } catch (error) {
                if (error instanceof ZodError) {
                    // Format errors like { email: ['error1', 'error2'], password: ['error1'] }
                    const formattedErrors: Record<string, string[]> = {};

                    error.errors.forEach((err) => {
                        const field = err.path.join("."); // Get the field name
                        if (!formattedErrors[field]) {
                            formattedErrors[field] = [];
                        }
                        formattedErrors[field].push(err.message); // Add validation message
                    });

                    return Send.validationErrors(reply, formattedErrors);
                }

                // If it's another type of error, send a generic error response
                return Send.error(reply, null, "Invalid request data");
            }
        };
    }

    static validateParams(schema: ZodSchema) {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                schema.parse(request.params);
                return;
            } catch (error) {
                if (error instanceof ZodError) {
                    const formattedErrors: Record<string, string[]> = {};

                    error.errors.forEach((err) => {
                        const field = err.path.join(".");
                        if (!formattedErrors[field]) {
                            formattedErrors[field] = [];
                        }
                        formattedErrors[field].push(err.message);
                    });

                    return Send.validationErrors(reply, formattedErrors);
                }

                return Send.error(reply, null, "Invalid request parameters");
            }
        };
    }

    static validateQuery(schema: ZodSchema) {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                schema.parse(request.query);
                return;
            } catch (error) {
                if (error instanceof ZodError) {
                    const formattedErrors: Record<string, string[]> = {};

                    error.errors.forEach((err) => {
                        const field = err.path.join(".");
                        if (!formattedErrors[field]) {
                            formattedErrors[field] = [];
                        }
                        formattedErrors[field].push(err.message);
                    });

                    return Send.validationErrors(reply, formattedErrors);
                }

                return Send.error(reply, null, "Invalid query parameters");
            }
        };
    }
}

export default ValidationMiddleware;