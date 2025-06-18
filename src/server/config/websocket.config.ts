import { UserOnline } from '../services/users.service'; // Adjust path if needed
import { FastifyInstance } from 'fastify';
import ws from 'ws';

export function handleOnlineStatusWebsocket(ws: ws, req: any) {

    const userId = req.user?.id || req.session?.userId || getUserIdFromCookies(req); // Adjust as per your auth setup

    if (userId) {
        UserOnline.addOnlineUser(userId, ws);
        console.log(`User ${userId} connected (online)`);

        ws.on('close', () => {
            UserOnline.removeOnlineUser(userId);
            console.log(`User ${userId} disconnected (offline)`);
        });
    }
}

// Helper function if you use cookies/JWT (implement as needed)
function getUserIdFromCookies(req: any): string | undefined {
    // Example: parse cookies or JWT from req.headers.cookie
    return undefined;
}

export async function registerUserStatusWebSocket(fastify: FastifyInstance) {
  // @ts-ignore: Ignore type error for websocket option if using fastify-websocket
  fastify.route({
    method: 'GET',
    url: '/ws/status',
    websocket: true,
    handler: () => {},
    wsHandler: (connection: any, req: any) => {
      const { socket } = connection;
      const userId = req.user?.id;

      if (!userId) {
        socket.close();
        return;
      }

      UserOnline.addOnlineUser(userId, socket);

      socket.on('close', () => {
        UserOnline.removeOnlineUser(userId);
      });
    }
  });
}