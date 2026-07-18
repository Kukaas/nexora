/**
 * Custom Next.js server with a socket.io layer for the resident/official chat.
 *
 * Next handles every HTTP route as usual; socket.io shares the same HTTP server
 * (default path /socket.io) and adds realtime presence + message delivery. The
 * io instance is stashed on globalThis so server actions (which run in this same
 * process) can emit after they persist a message — see lib/realtime/emit.ts.
 *
 * Run: `npm run dev` (tsx watch) or `npm run start` after `npm run build`.
 */
// Must be first: loads .env before lib/prisma reads DATABASE_URL at import time.
import "./load-env";

import { createServer } from "node:http";
import { parse } from "node:url";

import next from "next";
import { Server } from "socket.io";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOfficial } from "@/lib/roles";
import type { UserRoles } from "@/app/generated/prisma/enums";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/realtime/events";

const dev = !process.argv.includes("--prod");
const hostname = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

type SocketData = { userId: string; roles: UserRoles[]; official: boolean };

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url ?? "", true));
  });

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, { cors: { origin: false } });

  // Let server actions reach the socket layer after they persist a message.
  (globalThis as unknown as { __nexoraIO?: Server }).__nexoraIO =
    io as unknown as Server;

  // Presence: count live sockets per user so multiple tabs don't flap the dot.
  const online = new Map<string, number>();
  const presence = () => ({ online: [...online.keys()] });

  io.use(async (socket, done) => {
    try {
      const cookie = socket.request.headers.cookie ?? "";
      const session = await auth.api.getSession({
        headers: new Headers({ cookie }),
      });
      if (!session) return done(new Error("unauthorized"));
      const roles = (session.user.roles as UserRoles[] | undefined) ?? [];
      socket.data.userId = session.user.id;
      socket.data.roles = roles;
      socket.data.official = isOfficial(roles);
      done();
    } catch {
      done(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, official } = socket.data;

    socket.join(`user:${userId}`);
    if (official) socket.join("officials");

    online.set(userId, (online.get(userId) ?? 0) + 1);
    io.emit("presence:state", presence());

    socket.on("conversation:join", async (conversationId, ack) => {
      try {
        const convo = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { residentId: true },
        });
        // Residents may only enter their own desk thread; officials, any.
        if (!convo || (!official && convo.residentId !== userId)) {
          return ack?.({ ok: false });
        }
        socket.join(`conv:${conversationId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("typing", ({ conversationId, typing }) => {
      socket
        .to(`conv:${conversationId}`)
        .emit("typing", { conversationId, userId, typing });
    });

    socket.on("disconnect", () => {
      const remaining = (online.get(userId) ?? 1) - 1;
      if (remaining <= 0) online.delete(userId);
      else online.set(userId, remaining);
      io.emit("presence:state", presence());
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Nexora ready on http://${hostname}:${port} (${dev ? "dev" : "production"})`,
    );
  });
}

main().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
