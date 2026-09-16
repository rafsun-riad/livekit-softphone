import { env } from "@/src/config/env";
import type { SocketEventType } from "@/src/features/calls/types";

type SocketEvent = {
  type: SocketEventType | string;
  payload: unknown;
};

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
type EventListener = (event: SocketEvent) => void;
type StatusListener = (status: ConnectionStatus) => void;

const MAX_RECONNECT_DELAY_MS = 10_000;

function buildSocketUrl() {
  const baseUrl = env.wsUrl.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_WS_URL is not configured.");
  }

  return `${baseUrl}/ws/signaling/`;
}

type ReactNativeWebSocketConstructor = new (
  url: string,
  protocols?: string | string[],
  options?: { headers?: Record<string, string> },
) => WebSocket;

class SocketClient {
  private accessToken: string | null = null;
  private reconnectDelay = 1_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private socket: WebSocket | null = null;
  private eventListeners = new Set<EventListener>();
  private statusListeners = new Set<StatusListener>();

  subscribe(listener: EventListener) {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  connect(accessToken: string) {
    this.accessToken = accessToken;
    this.shouldReconnect = true;

    if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
      return;
    }

    this.clearReconnectTimer();
    this.emitStatus("connecting");
    const SocketConstructor =
      WebSocket as unknown as ReactNativeWebSocketConstructor;
    const socket = new SocketConstructor(buildSocketUrl(), undefined, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    socket.onopen = () => {
      this.reconnectDelay = 1_000;
      this.emitStatus("connected");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as SocketEvent;
        this.eventListeners.forEach((listener) => {
          listener(payload);
        });
      } catch {
        this.emitStatus("error");
      }
    };

    socket.onerror = () => {
      this.emitStatus("error");
    };

    socket.onclose = () => {
      this.socket = null;
      this.emitStatus("disconnected");
      if (!this.shouldReconnect || !this.accessToken) {
        return;
      }

      this.reconnectTimer = setTimeout(() => {
        if (this.accessToken) {
          this.connect(this.accessToken);
        }
      }, this.reconnectDelay);
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        MAX_RECONNECT_DELAY_MS,
      );
    };

    this.socket = socket;
  }

  disconnect() {
    this.shouldReconnect = false;
    this.accessToken = null;
    this.clearReconnectTimer();
    this.socket?.close();
    this.socket = null;
    this.emitStatus("disconnected");
  }

  send(type: string, payload: Record<string, unknown> = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify({ type, payload }));
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emitStatus(status: ConnectionStatus) {
    this.statusListeners.forEach((listener) => {
      listener(status);
    });
  }
}

export const socketClient = new SocketClient();
