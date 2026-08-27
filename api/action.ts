import type { Request, Response } from 'express';
import { executeAction } from '../src/server/gameEngine';
import { ClientAction } from '../src/types';

export default function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.body as ClientAction;
  if (!action || !action.type) {
    return res.status(400).json({ error: 'Invalid action payload' });
  }

  let responseMsg: object | null = null;
  executeAction(action, (msg) => {
    responseMsg = msg;
  });

  return res.status(200).json(responseMsg || { status: 'ok' });
}
