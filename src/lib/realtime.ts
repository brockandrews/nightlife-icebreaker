import { EventEmitter } from "events";

// Global in-memory Event Hub for Server-Sent Events (SSE) and instant push
class RealtimeEventHub {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(500); // Support up to 500 concurrent connections per event
  }

  // Broadcast event to a specific channel (e.g. `event:${eventId}` or `player:${playerId}`)
  broadcast(channel: string, eventName: string, data: any) {
    this.emitter.emit(channel, {
      eventName,
      data,
      timestamp: Date.now(),
    });
  }

  // Subscribe to channel
  subscribe(
    channel: string,
    callback: (payload: { eventName: string; data: any; timestamp: number }) => void
  ) {
    this.emitter.on(channel, callback);
    return () => {
      this.emitter.off(channel, callback);
    };
  }
}

const globalForHub = globalThis as unknown as {
  realtimeHub: RealtimeEventHub | undefined;
};

export const realtimeHub =
  globalForHub.realtimeHub ?? new RealtimeEventHub();

if (process.env.NODE_ENV !== "production") {
  globalForHub.realtimeHub = realtimeHub;
}
