import type { Request, Response } from 'express';
import { rooms, checkLazyRoomTimer } from '../../src/server/gameEngine';

export default function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const roomId = (req.query.id || req.query.roomId || '').toString().toUpperCase().trim();
  if (!roomId) {
    return res.status(400).json({ error: 'Missing room ID parameter' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: `Room "${roomId}" not found` });
  }

  checkLazyRoomTimer(room);

  return res.status(200).json({ state: room });
}
