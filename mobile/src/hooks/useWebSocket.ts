import { socketClient } from "@/src/lib/realtime/socket-client";
import { useCallStore } from "@/src/stores/call-store";

export function useWebSocket() {
  const connectionStatus = useCallStore((state) => state.socketStatus);

  return {
    connectionStatus,
    sendAck(payload: Record<string, unknown> = {}) {
      socketClient.send("client.ack", payload);
    },
    sendPing() {
      socketClient.send("client.ping", {});
    },
  };
}
