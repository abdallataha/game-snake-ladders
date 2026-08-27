import type { Request, Response } from 'express';
import { rooms } from '../src/server/gameEngine';

export default function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const roomList = Array.from(rooms.values()).map((r) => ({
    roomId: r.roomId,
    roomName: r.roomName,
    status: r.status,
    roundNumber: r.roundNumber,
    playersCount: Object.keys(r.players).length,
    lastActionTimestamp: r.lastActionTimestamp,
  }));

  return res.status(200).json({ rooms: roomList });
}
