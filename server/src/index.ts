import http from "node:http";
import express, { type Request, type Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import type { OfficeConfig, OfficeEvent } from "@office/shared";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const DEFAULT_PORT = 4000;

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "ai-agent-office-daemon",
    timestamp: new Date().toISOString()
  });
});

io.on("connection", (socket) => {
  console.log(`[Daemon] Cliente conectado vía Socket.io: ${socket.id}`);

  const initialEvent: OfficeEvent = {
    id: `init-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId: "system",
    type: "STATE_CHANGE",
    state: "IDLE",
    provider: "local",
    watch_type: "antigravity",
    content: "Conexión establecida con el daemon de AI Agent Office."
  };

  socket.emit("office:event", initialEvent);

  socket.on("disconnect", () => {
    console.log(`[Daemon] Cliente desconectado: ${socket.id}`);
  });
});

export function createOfficeServer(port: number = DEFAULT_PORT): http.Server {
  return server.listen(port, () => {
    console.log(`[Daemon] AI Agent Office corriendo en http://localhost:${port}`);
  });
}

// Iniciar servidor si se ejecuta como proceso principal
if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  createOfficeServer(port);
}

export { app, server, io };
