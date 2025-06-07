import authConfig from "../config/auth.config";
import { ResponseUtils as Send } from "../utils/response.utils";
import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { UserService } from "../services/users.service";

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
     */
    static authenticateUser = async (request: FastifyRequestWithCookies, reply: FastifyReply) => {
        // DEBUG: Log all cookies
        console.log('🍪 Auth middleware - All cookies:', request.cookies);
        console.log('🔑 Auth middleware - accessToken:', request.cookies?.accessToken ? '***EXISTS***' : 'MISSING');

        const token = request.cookies.accessToken;

        if (!token) {
            console.log('❌ No access token found');
            return Send.unauthorized(reply, "Access token missing");
        }

        try {
            console.log('🔧 Auth config secret exists:', authConfig.secret ? '***EXISTS***' : 'MISSING');

            const decodedToken = jwt.verify(token, authConfig.secret) as DecodedToken;
            console.log('✅ Token verified successfully, userId:', decodedToken.userId);

            // Attach user information to the request object
            (request as any).userId = decodedToken.userId;

            return;
        } catch (error) {
            console.error("❌ Authentication failed:", error);
            return Send.unauthorized(reply, "Invalid or expired access token");
        }
    };

    /**
     * Middleware to validate refresh token (checks database)
     */
    static refreshTokenValidation = async (request: FastifyRequestWithCookies, reply: FastifyReply) => {
        const refreshToken = request.cookies.refreshToken;

        if (!refreshToken) {
            return Send.unauthorized(reply, "No refresh token provided");
        }

        try {
            // Verify the refresh token
            const decodedToken = jwt.verify(refreshToken, authConfig.refresh_secret) as { userId: number };

            // Check if refresh token exists in database and matches
            const user = await UserService.getUserById(decodedToken.userId);
            if (!user || user.refreshToken !== refreshToken) {
                return Send.unauthorized(reply, "Invalid refresh token");
            }

            // Attach user information to the request object
            (request as any).userId = decodedToken.userId;

            return;
        } catch (error) {
            console.error("Refresh Token authentication failed:", error);
            return Send.unauthorized(reply, "Invalid or expired refresh token");
        }
    };

    /**
     * Optional middleware for routes that can work with or without authentication
     */
    static optionalAuth = async (request: FastifyRequestWithCookies, reply: FastifyReply) => {
        const token = request.cookies.accessToken;

        if (!token) {
            return;
        }

        try {
            const decodedToken = jwt.verify(token, authConfig.secret) as DecodedToken;
            (request as any).userId = decodedToken.userId;
            return;
        } catch (error) {
            console.warn("Optional authentication failed:", error);
            return;
        }
    };
}

export default AuthMiddleware;