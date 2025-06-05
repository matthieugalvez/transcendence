import { FastifyReply } from 'fastify';

class Send {
    static success(reply: FastifyReply, data: any, message = "success") {
        reply.code(200).send({
            ok: true,
            message,
            data
        });
        return;
    }

    static error(reply: FastifyReply, data: any, message = "error") {
        // A generic 500 Internal Server Error is returned for unforeseen issues
        reply.code(500).send({
            ok: false,
            message,
            data,
        });
        return;
    }

    static notFound(reply: FastifyReply, data: any, message = "not found") {
        // 404 is for resources that don't exist
        reply.code(404).send({
            ok: false,
            message,
            data,
        });
        return;
    }

    static unauthorized(reply: FastifyReply, data: any, message = "unauthorized") {
        // 401 for unauthorized access (e.g., invalid token)
        reply.code(401).send({
            ok: false,
            message,
            data,
        });
        return;
    }

    static validationErrors(reply: FastifyReply, errors: Record<string, string[]>) {
        // 422 for unprocessable entity (validation issues)
        reply.code(422).send({
            ok: false,
            message: "Validation error",
            errors,
        });
        return;
    }

    static forbidden(reply: FastifyReply, data: any, message = "forbidden") {
        // 403 for forbidden access (when the user does not have the rights to access)
        reply.code(403).send({
            ok: false,
            message,
            data,
        });
        return;
    }

    static badRequest(reply: FastifyReply, data: any, message = "bad request") {
        // 400 for general bad request errors
        reply.code(400).send({
            ok: false,
            message,
            data,
        });
        return;
    }

    static created(reply: FastifyReply, data: any, message = "created") {
        // 201 for successful resource creation
        reply.code(201).send({
            ok: true,
            message,
            data,
        });
        return;
    }

    static noContent(reply: FastifyReply) {
        // 204 for successful operation with no content to return
        reply.code(204).send();
        return;
    }
}

export default Send;