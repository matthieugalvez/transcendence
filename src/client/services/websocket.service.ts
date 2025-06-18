export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: WebSocket | null = null;
  private onlineUsers: Set<string> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.connect();
  }

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
      const port = location.port || '5173';
      const socketUrl = `${protocol}://${location.hostname}:${port}/ws/status`;

      console.log('Connecting to WebSocket:', socketUrl);
      this.socket = new WebSocket(socketUrl);

      this.socket.addEventListener('open', () => {
        console.log('WebSocket connected for online status');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket received:', data);

          if (data.type === 'status') {
            if (data.online) {
              this.onlineUsers.add(data.userId);
              console.log(`User ${data.userId} is now online`);
            } else {
              this.onlineUsers.delete(data.userId);
              console.log(`User ${data.userId} is now offline`);
            }

            // Update any online status indicators in the DOM
            this.updateStatusIndicators(data.userId, data.online);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      this.socket.addEventListener('close', (event) => {
        console.log(`WebSocket disconnected (${event.code}): ${event.reason}`);
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      });

      this.socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    }
  }

  private updateStatusIndicators(userId: string, isOnline: boolean) {
    // Update status dots in the UI
    document.querySelectorAll(`[data-user-status="${userId}"]`).forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.background = isOnline ? 'green' : 'red';
        element.title = isOnline ? 'Online' : 'Offline';
      }
    });
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}