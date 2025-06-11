import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import OAuth2, {OAuth2Namespace} from "@fastify/oauth2";

export const googleOAuth2Options = {
    name: 'GoogleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
        client: {
            id: process.env.GOOGLE_CLIENT_ID || "<CLIENT_ID>",
            secret: process.env.GOOGLE_CLIENT_SECRET || "<CLIENT_SECRET>"
        },
        auth: OAuth2.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/auth/oauth2/google',
    callbackUri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/oauth2/google/callback`,
}