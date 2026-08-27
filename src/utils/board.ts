import { Snake, Ladder, Player } from '../types';

// Exactly 5 ladders on a 50-square board — all non-vertical (clear natural slant angle)
export const LADDERS: Ladder[] = [
  { id: 'ladder-1', bottom: 3, top: 16 }, // (col 2 -> col 4) dx=+200
  { id: 'ladder-2', bottom: 12, top: 26 }, // (col 8 -> col 5) dx=-300
  { id: 'ladder-3', bottom: 19, top: 38 }, // (col 1 -> col 2) dx=+100
  { id: 'ladder-4', bottom: 24, top: 42 }, // (col 3 -> col 1) dx=-200
  { id: 'ladder-5', bottom: 34, top: 48 }, // (col 6 -> col 7) dx=+100
];

// Exactly 7 snakes on a 50-square board
export const SNAKES: Snake[] = [
  { id: 'snake-1', head: 17, tail: 5 },
  { id: 'snake-2', head: 22, tail: 7 },
  { id: 'snake-3', head: 30, tail: 14 },
  { id: 'snake-4', head: 36, tail: 15 },
  { id: 'snake-5', head: 41, tail: 23 },
  { id: 'snake-6', head: 45, tail: 27 },
  { id: 'snake-7', head: 49, tail: 10 },
];

export const BOARD_SIZE = 50;
export const GRID_COLS = 10;
export const GRID_ROWS = 5;

/**
 * Calculates (col, row) for a 50-square board (10 cols x 5 rows).
 * In SVG/Canvas coordinates (viewBox 0 0 1000 500), (x, y) returns center point.
 */
export function getSquareCenter(square: number): { x: number; y: number; col: number; row: number } {
  if (square <= 0) {
    // Starting holding zone off the board (bottom left)
    return { x: -30, y: 480, col: -1, row: 0 };
  }
  const clampedSquare = Math.min(Math.max(square, 1), 50);
  const row = Math.floor((clampedSquare - 1) / 10); // 0 (bottom row 1-10) to 4 (top row 41-50)
  const isEvenRow = row % 2 === 0; // rows 0, 2, 4 go L -> R; rows 1, 3 go R -> L
  const col = isEvenRow ? (clampedSquare - 1) % 10 : 9 - ((clampedSquare - 1) % 10);

  // viewBox is 1000x500, each cell is 100x100
  const x = col * 100 + 50;
  const y = (4 - row) * 100 + 50; // top row (row 4) is y=50, bottom row (row 0) is y=450

  return { x, y, col, row };
}

export function checkSnakeOrLadder(position: number): {
  type: 'snake' | 'ladder' | 'none';
  destination: number;
  entity?: Snake | Ladder;
} {
  const ladder = LADDERS.find((l) => l.bottom === position);
  if (ladder) {
    return { type: 'ladder', destination: ladder.top, entity: ladder };
  }
  const snake = SNAKES.find((s) => s.head === position);
  if (snake) {
    return { type: 'snake', destination: snake.tail, entity: snake };
  }
  return { type: 'none', destination: position };
}

// Tile colors for dark slate & glowing neon aesthetic
export function getSquareColorTheme(square: number): { bg: string; border: string; text: string } {
  if (square === 50) {
    return { bg: 'from-amber-500/90 via-rose-500/90 to-indigo-600/90 shadow-lg shadow-amber-500/20', border: 'border-amber-400 ring-1 ring-amber-300', text: 'text-white font-black' };
  }
  if (square === 1) {
    return { bg: 'from-emerald-950/90 to-teal-900/90', border: 'border-emerald-500/70', text: 'text-emerald-300 font-bold' };
  }

  // Check if snake head or ladder bottom
  const isLadderStart = LADDERS.some((l) => l.bottom === square);
  if (isLadderStart) {
    return { bg: 'from-amber-950/60 via-slate-900 to-amber-900/40', border: 'border-amber-400/60', text: 'text-amber-300 font-bold' };
  }
  const isSnakeHead = SNAKES.some((s) => s.head === square);
  if (isSnakeHead) {
    return { bg: 'from-rose-950/60 via-slate-900 to-red-900/40', border: 'border-rose-500/60', text: 'text-rose-300 font-bold' };
  }

  // Alternating deep slate pattern
  const row = Math.floor((square - 1) / 10);
  const col = (square - 1) % 10;
  const isEven = (row + col) % 2 === 0;

  if (isEven) {
    return { bg: 'from-slate-900/90 to-slate-900/70', border: 'border-slate-800/80', text: 'text-slate-400' };
  } else {
    return { bg: 'from-slate-800/60 to-slate-800/40', border: 'border-slate-800/80', text: 'text-slate-400' };
  }
}

// 32 Distinct Avatar Emojis to guarantee unique avatar for every player
export const DISTINCT_AVATARS = [
  '🦁', '🐯', '🦊', '🐼', '🐉', '🦅', '🦄', '🐺',
  '🐸', '🐵', '🐙', '🦖', '🦈', '🐻', '🦉', '🦋',
  '🐝', '🦚', '🦩', '🦔', '🦘', '🦭', '🐬', '🦥',
  '🐘', '🦒', '🦓', '🐆', '🐧', '🦜', '🦝', '🦫',
];

// 30 Distinct Vibrant Colors to guarantee unique color for every player
export const DISTINCT_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
  '#0ea5e9', // Sky
  '#f43f5e', // Rose
  '#22c55e', // Green
  '#64748b', // Slate
  '#b91c1c', // Dark Red
  '#1d4ed8', // Dark Blue
  '#047857', // Dark Emerald
  '#6d28d9', // Dark Purple
  '#b45309', // Dark Amber
  '#be185d', // Dark Pink
  '#0e7490', // Dark Cyan
  '#c2410c', // Dark Orange
  '#4338ca', // Dark Indigo
  '#4d7c0f', // Dark Lime
  '#a21caf', // Dark Fuchsia
  '#0369a1', // Dark Sky
];

/**
 * Automatically assign the next unused avatar & color from the pool to guarantee
 * that each player in the room has a distinct avatar and color.
 */
export function getNextUniqueAvatarAndColor(existingPlayers: Record<string, Player> | Player[]): { avatar: string; color: string } {
  const playerList = Array.isArray(existingPlayers) ? existingPlayers : Object.values(existingPlayers);
  const usedAvatars = new Set(playerList.map((p) => p.avatar));
  const usedColors = new Set(playerList.map((p) => p.color));

  const availableAvatar =
    DISTINCT_AVATARS.find((a) => !usedAvatars.has(a)) ||
    DISTINCT_AVATARS[playerList.length % DISTINCT_AVATARS.length];

  const availableColor =
    DISTINCT_COLORS.find((c) => !usedColors.has(c)) ||
    DISTINCT_COLORS[playerList.length % DISTINCT_COLORS.length];

  return { avatar: availableAvatar, color: availableColor };
}
