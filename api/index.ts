import express, { Request, Response } from 'express';
import { rooms, executeAction, checkLazyRoomTimer } from '../src/server/gameEngine';
import { ClientAction } from '../src/types';

const app = express();

app.use(express.json());

// Enable CORS for flexibility across Vercel deployments and preview URLs
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Health check endpoint
app.get(['/api/health', '/api'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    runtime: 'vercel-serverless',
    timestamp: Date.now(),
    activeRoomsCount: rooms.size,
  });
});

// Room State retrieval with automatic lazy timer resolution
app.get('/api/room/:roomId', (req: Request, res: Response) => {
  const roomId = req.params.roomId.toUpperCase().trim();
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: `Room "${roomId}" not found` });
  }

  // Evaluate lazy timers (e.g. 30-sec round timer when running in serverless)
  checkLazyRoomTimer(room);

  res.json({ state: room });
});

// Action Execution Endpoint
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

// List rooms (for debug or monitoring)
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

// Export default app for Vercel Serverless Function runtime
export default app;
