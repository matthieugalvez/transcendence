export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: WebSocket | null = null;
  private onlineUsers: Set<string> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  private statusCallbacks: Set<(userId: string, isOnline: boolean) => void> = new Set();

  private constructor() {
    // Get current user ID immediately when service starts
    this.initializeCurrentUser();
    this.connect();
  }

  private async initializeCurrentUser() {
    try {
      const user = await import('../services/user.service').then(m => m.UserService.getCurrentUser());
      this.currentUserId = user.id;
    //   console.log('WebSocket service initialized with user ID:', this.currentUserId);
    } catch (error) {
      console.error('Failed to get current user for WebSocket:', error);
    }
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
      const port = 3000;
      const socketUrl = `${protocol}://${location.hostname}:${port}/ws/status`;

    //   console.log('Connecting to WebSocket:', socketUrl);
      this.socket = new WebSocket(socketUrl);

      this.socket.addEventListener('open', () => {
        // console.log('WebSocket connected for online status');
        // Add current user to online set immediately upon connection
        if (this.currentUserId) {
          this.onlineUsers.add(this.currentUserId);
        //   console.log(`Added current user ${this.currentUserId} to online set`);
        }

        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
        //   console.log('WebSocket received:', data);

          // Handle welcome message
          if (data.type === 'welcome') {
            // console.log('Received welcome message');
            return;
          }

          // Handle status updates
          if (data.type === 'status') {
            const wasOnline = this.onlineUsers.has(data.userId);

            if (data.online) {
              this.onlineUsers.add(data.userId);
            } else {
              this.onlineUsers.delete(data.userId);
            }

            // Only notify if status actually changed OR if it's the first time we see this user
            if (wasOnline !== data.online) {
            //   console.log(`User ${data.userId} status changed: ${data.online ? 'online' : 'offline'}`);
            //   console.log(`Current user: ${this.currentUserId}, Status update for: ${data.userId}`);

              // Notify all callbacks
              this.statusCallbacks.forEach(callback => {
                try {
                  callback(data.userId, data.online);
                } catch (error) {
                  console.error('Error in status callback:', error);
                }
              });

              // Update DOM elements
              this.updateStatusIndicators(data.userId, data.online);
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      this.socket.addEventListener('close', (event) => {
        // console.log(`WebSocket disconnected (${event.code}): ${event.reason}`);
        // Clear all users from online list when disconnected
        this.onlineUsers.clear();
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
    document.querySelectorAll(`[data-user-status="${userId}"]`).forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.background = isOnline ? 'green' : 'red';
        element.title = isOnline ? 'Online' : 'Offline';
        // console.log(`Updated status indicator for ${userId}: ${isOnline ? 'online' : 'offline'}`);
      }
    });
  }

  isUserOnline(userId: string): boolean {
    const isOnline = this.onlineUsers.has(userId);
    // console.log(`Checking if user ${userId} is online: ${isOnline}`);
    // console.log('Current online users:', Array.from(this.onlineUsers));
    return isOnline;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // Add callback for status changes
  onStatusChange(callback: (userId: string, isOnline: boolean) => void) {
    this.statusCallbacks.add(callback);
  }

  // Add method to wait for connection
  async waitForConnection(timeout = 5000): Promise<boolean> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return true;
    }

    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          resolve(true);
        } else {
          setTimeout(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
              resolve(true);
            } else {
              resolve(false);
            }
          }, timeout);
        }
      };

      if (this.socket) {
        this.socket.addEventListener('open', () => resolve(true), { once: true });
        checkConnection();
      } else {
        resolve(false);
      }
    });
  }
}