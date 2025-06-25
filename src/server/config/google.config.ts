import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import OAuth2, { OAuth2Namespace } from "@fastify/oauth2";
import { appConfig } from "./app.config.js";

export const createGoogleOAuth2Options = (request: FastifyRequest) => {
  const protocol = request.protocol;
  const host = request.headers.host;

  // Determine base URL based on environment

  let baseUrl: string;
  if (process.env.NODE_ENV === 'production') {
    baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
  } else {
    baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  console.log('🔍 Google OAuth config:', {
    nodeEnv: process.env.NODE_ENV,
    protocol,
    host,
    baseUrl,
    callbackUri: `${baseUrl}/api/auth/oauth2/google/callback`
  });

  return {
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
    callbackUri: `${baseUrl}/api/auth/oauth2/google/callback`,
  };
};

// Fallback static config for cases where request is not available
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
  // Use the BASE_URL from environment or fallback
  callbackUri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/oauth2/google/callback`,
};