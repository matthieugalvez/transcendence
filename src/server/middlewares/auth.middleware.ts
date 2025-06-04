import authConfig from "./config/auth.config";
import Send from "./utils/response.utils";
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export interface DecodedToken {
    userId: number;
}

// Extend FastifyRequest to include cookies
interface FastifyRequestWithCookies extends FastifyRequest {
    cookies: { [cookieName: string]: string | undefined };
}

class AuthMiddleware {
    /**
     * Middleware to authenticate the user based on the access token stored in the HttpOnly cookie.
     * This middleware will verify the access token and attach the user information to the request object.
     */
    static authenticateUser = async (request: FastifyRequestWithCookies, reply: FastifyReply) => {
        // 1. Extract the access token from the HttpOnly cookie
        const token = request.cookies.accessToken;

        // If there's no access token, return an error
        if (!token) {
            return Send.unauthorized(reply, null, "Access token missing");
        }

        try {
            // 2. Verify the token using the secret from the auth config
            const decodedToken = jwt.verify(token, authConfig.secret) as DecodedToken;

            // If the token is valid, attach user information to the request object
            (request as any).userId = decodedToken.userId;

            // In Fastify, we just return to continue to the next handler
            return;
        } catch (error) {
            // If the token verification fails (invalid or expired token), return an error
            console.error("Authentication failed:", error);
            return Send.unauthorized(reply, null, "Invalid or expired access token");
        }
    };

    static refreshTokenValidation = async (request: FastifyRequestWithCookies, reply: FastifyReply) => {
        // 1. Extract the refresh token from the HttpOnly cookie
        const refreshToken = request.cookies.refreshToken;

        // If there's no refresh token, return an error
        if (!refreshToken) {
            return Send.unauthorized(reply, null, "No refresh token provided");
        }

        try {
            // 2. Verify the refresh token using the secret from the auth config
            const decodedToken = jwt.verify(refreshToken, authConfig.refresh_secret) as { userId: number };

            // If the token is valid, attach user information to the request object
            (request as any).userId = decodedToken.userId;

            // In Fastify, we just return to continue to the next handler
            return;
        } catch (error) {
            // Handle token verification errors (invalid or expired token)
            console.error("Refresh Token authentication failed:", error);
            return Send.unauthorized(reply, null, "Invalid or expired refresh token");
        }
    };

    /**
     * Optional middleware for routes that can work with or without authentication
     */
    static optionalAuth = async (request: FastifyRequestWithCookies, reply: FastifyReply) => {
        const token = request.cookies.accessToken;

        if (!token) {
            // No token provided, but that's okay for optional auth
            return;
        }

        try {
            const decodedToken = jwt.verify(token, authConfig.secret) as DecodedToken;
            (request as any).userId = decodedToken.userId;
            return;
        } catch (error) {
            // Token is invalid, but we don't return an error for optional auth
            console.warn("Optional authentication failed:", error);
            return;
        }
    };
}

export default AuthMiddleware;