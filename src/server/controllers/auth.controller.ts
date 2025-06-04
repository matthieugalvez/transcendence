import Send from "@utils/response.utils";
import { prisma } from "db";
import { FastifyRequest, FastifyReply } from "fastify";
import authSchema from "validations/auth.schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";
import authConfig from "@config/auth.config";

class AuthController {
    static login = async (request: FastifyRequest, reply: FastifyReply) => {
        // Destructure the request body into the expected fields
        const { name, password } = request.body as { name: string, password: string };

        try {
            // 1. Check if the user exists in the database
            const user = await prisma.user.findUnique({
                where: { name }
            });
            // If user does not exist, return an error
            if (!user) {
                return Send.unauthorized(reply, null, "Invalid credentials");
            }

            // 2. Compare the provided password with the hashed password stored in the database
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return Send.unauthorized(reply, null, "Invalid credentials");
            }

            // 3. Generate an access token (JWT) with a short expiration time (e.g., 15 minutes)
            const accessToken = jwt.sign(
                { userId: user.id },
                authConfig.secret,  // Use the secret from the authConfig for signing the access token
                { expiresIn: authConfig.secret_expires_in as any }  // Use the expiration time from the config (e.g., "15m")
            );

            // 4. Generate a refresh token with a longer expiration time (e.g., 7 days)
            const refreshToken = jwt.sign(
                { userId: user.id },
                authConfig.refresh_secret,  // Use the separate secret for signing the refresh token
                { expiresIn: authConfig.refresh_secret_expires_in as any }  // Use the expiration time for the refresh token (e.g., "24h")
            );

            // 5. Store the refresh token in the database (optional)
            await prisma.user.update({
                where: { name },
                data: { refreshToken }
            });

            // 6. Set the access token and refresh token in HttpOnly cookies using Fastify
            reply.setCookie("accessToken", accessToken, {
                httpOnly: true,   // Ensure the cookie cannot be accessed via JavaScript (security against XSS attacks)
                secure: process.env.NODE_ENV === "production",  // Set to true in production for HTTPS-only cookies
                maxAge: 15 * 60 * 1000,  // 15 minutes in milliseconds
                sameSite: "strict"  // Ensures the cookie is sent only with requests from the same site
            });

            reply.setCookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 24 * 60 * 60 * 1000,  // 24 hours in milliseconds
                sameSite: "strict"
            });

            // 7. Return a successful response with the user's basic information
            return Send.success(reply, {
                id: user.id,
                name: user.name,
                created_at: user.created_at
            }, "Login successful");

        } catch (error) {
            // If any error occurs, return a generic error response
            console.error("Login Failed:", error); // Log the error for debugging
            return Send.error(reply, null, "Login failed");
        }
    }

    static register = async (request: FastifyRequest, reply: FastifyReply) => {
        // Destructure the request body into the expected fields
        const { name, password, password_confirmation } = request.body as {
            name: string,
            password: string,
            password_confirmation: string
        };

        try {
            // 1. Check password confirmation
            if (password !== password_confirmation) {
                return Send.badRequest(reply, null, "Passwords do not match");
            }

            // 2. Check if the user already exists in the database
            const existingUser = await prisma.user.findUnique({
                where: { name }
            });
            // If a user with the same name exists, return an error response
            if (existingUser) {
                return Send.badRequest(reply, null, "Username is already taken");
            }

            // 3. Hash the password using bcrypt to ensure security before storing it in the DB
            const hashedPassword = await bcrypt.hash(password, 10);

            // 4. Create a new user in the database with hashed password
            const newUser = await prisma.user.create({
                data: {
                    name,
                    password_hash: hashedPassword
                }
            });

            // 5. Return a success response with the new user data (excluding password for security)
            return Send.created(reply, {
                id: newUser.id,
                name: newUser.name,
                created_at: newUser.created_at
            }, "User successfully registered");

        } catch (error) {
            // Handle any unexpected errors (e.g., DB errors, network issues)
            console.error("Registration failed:", error); // Log the error for debugging
            return Send.error(reply, null, "Registration failed");
        }
    }

    static logout = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // 1. Get user ID from authenticated request
            const userId = (request as any).userId;  // Assumed that user data is added by the middleware

            if (userId) {
                // 2. Remove the refresh token from the database
                await prisma.user.update({
                    where: { id: userId },
                    data: { refreshToken: null }  // Clear the refresh token from the database
                });
            }

            // 3. Remove the access and refresh token cookies using Fastify
            reply.clearCookie("accessToken");
            reply.clearCookie("refreshToken");

            // 4. Send success response after logout
            return Send.success(reply, null, "Logged out successfully");

        } catch (error) {
            // 5. If an error occurs, return an error response
            console.error("Logout failed:", error); // Log the error for debugging
            return Send.error(reply, null, "Logout failed");
        }
    }

    static refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).userId;  // Get userId from the refreshTokenValidation middleware
            const refreshToken = request.cookies.refreshToken;  // Get the refresh token from cookies

            // Check if the refresh token has been revoked
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || !user.refreshToken) {
                return Send.unauthorized(reply, null, "Refresh token not found");
            }

            // Check if the refresh token in the database matches the one from the client
            if (user.refreshToken !== refreshToken) {
                return Send.unauthorized(reply, null, "Invalid refresh token");
            }

            // Generate a new access token
            const newAccessToken = jwt.sign(
                { userId: user.id },
                authConfig.secret,
                { expiresIn: authConfig.secret_expires_in as any }
            );

            // Send the new access token in the response using Fastify
            reply.setCookie("accessToken", newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60 * 1000,  // 15 minutes
                sameSite: "strict"
            });

            return Send.success(reply, null, "Access token refreshed successfully");

        } catch (error) {
            console.error("Refresh Token failed:", error);
            return Send.error(reply, null, "Failed to refresh token");
        }
    }
}

export default AuthController;