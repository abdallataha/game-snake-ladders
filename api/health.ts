import type { Request, Response } from 'express';
import { rooms } from '../src/server/gameEngine';

export default function handler(req: Request, res: Response) {
  res.status(200).json({
    status: 'ok',
    runtime: 'vercel-serverless-function',
    timestamp: Date.now(),
    activeRoomsCount: rooms.size,
  });
}
