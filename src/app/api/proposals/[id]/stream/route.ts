import { NextRequest } from "next/server";

import { getProposal, listAgentEvents, subscribeToProposalEvents } from "@/lib/store";
import type { AgentEvent } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposal = getProposal(id);

  if (!proposal) {
    return new Response(JSON.stringify({ error: "Proposal not found." }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let keepAlive: ReturnType<typeof setInterval> | undefined;

  const sendEvent = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: AgentEvent
  ) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(`event: ready\ndata: ${JSON.stringify({ proposalId: id })}\n\n`)
      );

      for (const event of listAgentEvents(id)) {
        sendEvent(controller, event);
      }

      unsubscribe = subscribeToProposalEvents(id, (event) => {
        sendEvent(controller, event);
      });

      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        if (keepAlive) {
          clearInterval(keepAlive);
        }
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream already closed by client.
        }
      });
    },
    cancel() {
      if (keepAlive) {
        clearInterval(keepAlive);
      }
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
