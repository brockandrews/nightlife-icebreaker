import { NextRequest } from "next/server";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  const decodedChannel = decodeURIComponent(channel);

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connected event
  const initialData = `data: ${JSON.stringify({ event: "CONNECTED", channel: decodedChannel, timestamp: Date.now() })}\n\n`;
  await writer.write(encoder.encode(initialData));

  // Subscribe to real-time hub
  const unsubscribe = realtimeHub.subscribe(
    decodedChannel,
    async (payload) => {
      try {
        const message = `event: ${payload.eventName}\ndata: ${JSON.stringify(payload.data)}\n\n`;
        await writer.write(encoder.encode(message));
      } catch (err) {
        // Stream closed or error
      }
    }
  );

  // Keep-alive heartbeat every 15 seconds to prevent proxy drops
  const heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`: heartbeat\n\n`));
    } catch {
      clearInterval(heartbeatInterval);
      unsubscribe();
    }
  }, 15000);

  request.signal.addEventListener("abort", () => {
    clearInterval(heartbeatInterval);
    unsubscribe();
    try {
      writer.close();
    } catch {}
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
