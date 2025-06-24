import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { registerDb } from './db.js';
import { registerPlugins } from './config/plugins.config.js';
import { registerRoutes } from './routes/router.js';
import { registerPongWebSocket } from './routes/game.routes.js';
import { registerUserStatusWebSocket } from './routes/users.routes.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create Fastify instance
const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  trustProxy: true,  // Move this outside of logger config
});

// Register essential plugins first (before any other setup)
await app.register(fastifyWebsocket);

// Register cookie plugin once at the top level
await app.register(import('@fastify/cookie'), {
  secret: process.env.COOKIE_SECRET || 'your-cookie-secret',
  parseOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

// Server setup function
async function setupServer() {
  try {
    console.log('🔧 Setting up server...');

    await registerDb(app);
    await registerPlugins(app, __dirname);
    await registerRoutes(app);
    await registerPongWebSocket(app);
    await registerUserStatusWebSocket(app);

    console.log('✅ Server setup completed');
  } catch (error) {
    console.error('❌ Server setup failed:', error);
    throw error;
  }
}

// Start server
async function start() {
  try {
    await setupServer();
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log(`🎮 Production mode: ${process.env.NODE_ENV === 'production'}`);
  } catch (error) {
    app.log.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await app.close()
  process.exit(0)
})