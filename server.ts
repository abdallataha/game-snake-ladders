import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { rooms, executeAction, setBroadcastCallback, checkLazyRoomTimer } from './src/server/gameEngine';
import { ClientAction } from './src/types';

interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
  roomId?: string;
  playerId?: string;
}

const clientSockets = new Map<string, ExtWebSocket>(); // key: `${roomId}:${playerId}`

// Set up broadcast callback from gameEngine to WebSocket clients
setBroadcastCallback((roomId: string, message: object) => {
  const payload = JSON.stringify(message);
  for (const [key, ws] of clientSockets.entries()) {
    if (key.startsWith(`${roomId}:`) && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API HTTP endpoints (identical to Vercel Serverless Function endpoints)
  app.get(['/api/health', '/api'], (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      runtime: 'express-vite-server',
      timestamp: Date.now(),
      activeRoomsCount: rooms.size,
    });
  });

  app.get('/api/room/:roomId', (req: Request, res: Response) => {
    const roomId = req.params.roomId.toUpperCase().trim();
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room "${roomId}" not found` });
    }
    checkLazyRoomTimer(room);
    res.json({ state: room });
  });

  app.post('/api/action', (req: Request, res: Response) => {
    const action = req.body as ClientAction;
    if (!action || !action.type) {
      return res.status(400).json({ error: 'Invalid action payload' });
    }

    let responseMsg: object | null = null;
    executeAction(action, (msg) => {
      responseMsg = msg;
    });

    res.json(responseMsg || { status: 'ok' });
  });

  app.get('/api/rooms', (req: Request, res: Response) => {
    const roomList = Array.from(rooms.values()).map((r) => ({
      roomId: r.roomId,
      roomName: r.roomName,
      status: r.status,
      roundNumber: r.roundNumber,
      playersCount: Object.keys(r.players).length,
      lastActionTimestamp: r.lastActionTimestamp,
    }));
    res.json({ rooms: roomList });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: ExtWebSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const action: ClientAction = JSON.parse(raw.toString());
        executeAction(
          action,
          (response) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(response));
            }
          },
          (roomId, playerId) => {
            ws.roomId = roomId;
            ws.playerId = playerId;
            clientSockets.set(`${roomId}:${playerId}`, ws);
          }
        );
      } catch (err) {
        console.error('Error handling ws action:', err);
      }
    });

    ws.on('close', () => {
      if (ws.roomId && ws.playerId) {
        const key = `${ws.roomId}:${ws.playerId}`;
        clientSockets.delete(key);
        const room = rooms.get(ws.roomId);
        if (room && room.players[ws.playerId]) {
          room.players[ws.playerId].connected = false;
          const payload = JSON.stringify({ type: 'ROOM_STATE', payload: room });
          for (const [sKey, socket] of clientSockets.entries()) {
            if (sKey.startsWith(`${ws.roomId}:`) && socket.readyState === WebSocket.OPEN) {
              socket.send(payload);
            }
          }
        }
      }
    });
  });

  // Heartbeat ping interval
  const interval = setInterval(() => {
    wss.clients.forEach((wsClient) => {
      const extWs = wsClient as ExtWebSocket;
      if (extWs.isAlive === false) return extWs.terminate();
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Snakes & Ladders Server running on http://localhost:${PORT}`);
  });
}

startServer();
