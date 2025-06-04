import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// Define the possible HTTP methods for routes
type RouteMethod = "get" | "post" | "put" | "delete" | "patch";

// Type for Fastify route handler
type FastifyHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<any> | any;

// Type for Fastify middleware (preHandler)
type FastifyMiddleware = (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;

// Interface to describe the configuration of each route
export interface RouteConfig {
    method: RouteMethod;           // HTTP method (GET, POST, etc.)
    path: string;                  // Path for the route
    handler: FastifyHandler;       // Request handler for the route (controller method)
    middlewares?: FastifyMiddleware[];  // Optional middlewares for this route (preHandlers)
    schema?: any;                  // Optional JSON schema for validation
}

// Abstract base class for creating routes
export default abstract class BaseRouter {
    // Method to register routes on a Fastify instance
    public async register(fastify: FastifyInstance): Promise<void> {
        await this.registerRoutes(fastify);
    }

    // Abstract method that must be implemented by subclasses to define the routes
    protected abstract routes(): RouteConfig[];

    // Private method that registers all the routes defined in the `routes` method
    private async registerRoutes(fastify: FastifyInstance): Promise<void> {
        const routes = this.routes();

        for (const { method, path, handler, middlewares = [], schema } of routes) {
            // Register route with Fastify
            await fastify.route({
                method: method.toUpperCase() as any,
                url: path,
                preHandler: middlewares, // Fastify uses preHandler for middlewares
                handler: handler,
                schema: schema // Optional JSON schema for validation
            });
        }
    }
}