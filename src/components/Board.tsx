import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import { LADDERS, SNAKES, BOARD_SIZE, getSquareCenter, getSquareColorTheme } from '../utils/board';
import { Users } from 'lucide-react';

interface BoardProps {
  players: Player[];
  currentPlayerId: string | null;
  activeMovingPlayerId?: string | null;
  onSquareClick?: (square: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  players,
  currentPlayerId,
  activeMovingPlayerId,
  onSquareClick,
}) => {
  const [selectedSquareInspect, setSelectedSquareInspect] = useState<number | null>(null);

  // Group players by position
  const playersBySquare = useMemo(() => {
    const map = new Map<number, Player[]>();
    players.forEach((p) => {
      const pos = p.position;
      if (!map.has(pos)) {
        map.set(pos, []);
      }
      map.get(pos)!.push(p);
    });
    return map;
  }, [players]);

  const startingPlayers = playersBySquare.get(0) || [];

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 50-Square Board Container (10 cols x 5 rows, aspect-[2/1]) */}
      <div className="relative w-full max-w-[720px] aspect-[2/1] mx-auto rounded-2xl p-1.5 sm:p-2 bg-slate-900 shadow-xl border-2 sm:border-4 border-slate-700/80 ring-1 ring-slate-600/50 shadow-indigo-950/50">
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#0a0f1d] border border-slate-800 shadow-inner">
          {/* 10 Columns x 5 Rows Grid Tiles */}
          <div className="grid grid-cols-10 grid-rows-5 w-full h-full">
            {Array.from({ length: 5 }).map((_, rowIndex) => {
              const displayRow = 4 - rowIndex; // 4 at top (row 5: 41-50), 0 at bottom (row 1: 1-10)
              const isEvenRow = displayRow % 2 === 0;

              return Array.from({ length: 10 }).map((_, colIndex) => {
                const col = isEvenRow ? colIndex : 9 - colIndex;
                const squareNum = displayRow * 10 + col + 1;
                const theme = getSquareColorTheme(squareNum);
                const isStart = squareNum === 1;
                const isGoal = squareNum === BOARD_SIZE;

                const ladderBottom = LADDERS.find((l) => l.bottom === squareNum);
                const ladderTop = LADDERS.find((l) => l.top === squareNum);
                const snakeHead = SNAKES.find((s) => s.head === squareNum);
                const snakeTail = SNAKES.find((s) => s.tail === squareNum);

                const occupants = playersBySquare.get(squareNum) || [];

                return (
                  <div
                    key={squareNum}
                    onClick={() => {
                      if (occupants.length > 0) {
                        setSelectedSquareInspect(selectedSquareInspect === squareNum ? null : squareNum);
                      }
                      if (onSquareClick) onSquareClick(squareNum);
                    }}
                    className={`relative flex flex-col justify-between p-0.5 sm:p-1 border-[0.5px] ${theme.border} bg-gradient-to-br ${theme.bg} transition-colors hover:brightness-125 cursor-pointer overflow-hidden`}
                    title={`Square ${squareNum} ${occupants.length > 0 ? `(${occupants.length} players)` : ''}`}
                  >
                    {/* Square Number */}
                    <div className="flex items-center justify-between w-full leading-none z-0">
                      <span className={`text-[9px] sm:text-xs font-bold font-mono ${theme.text}`}>
                        {squareNum}
                      </span>
                      {isGoal && (
                        <span className="text-[10px] sm:text-xs animate-bounce" role="img" aria-label="Goal">
                          🏆 50
                        </span>
                      )}
                      {isStart && (
                        <span className="text-[6px] sm:text-[8px] font-mono font-black text-emerald-400">
                          START
                        </span>
                      )}
                    </div>

                    {/* Tile Badges / Hints */}
                    <div className="flex items-center justify-center pointer-events-none z-0">
                      {ladderBottom && (
                        <div className="bg-amber-500/30 text-amber-300 border border-amber-400/60 text-[6px] sm:text-[8px] font-extrabold px-0.5 py-0.2 rounded shadow-xs flex items-center gap-0.5">
                          <span>🪜</span>
                          <span>+{ladderBottom.top - ladderBottom.bottom}</span>
                        </div>
                      )}
                      {ladderTop && (
                        <div className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[5px] sm:text-[7px] font-semibold px-0.5 rounded">
                          TOP 🪜
                        </div>
                      )}
                      {snakeHead && (
                        <div className="bg-rose-600/30 text-rose-200 border border-rose-400/60 text-[6px] sm:text-[8px] font-extrabold px-0.5 py-0.2 rounded shadow-xs flex items-center gap-0.5 animate-pulse">
                          <span>🐍</span>
                          <span>-{snakeHead.head - snakeHead.tail}</span>
                        </div>
                      )}
                      {snakeTail && (
                        <div className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[5px] sm:text-[7px] font-semibold px-0.5 rounded">
                          TAIL 🐍
                        </div>
                      )}
                    </div>

                    {/* Subtle Tile Coordinate */}
                    <div className="self-end text-[5px] sm:text-[6px] opacity-20 font-mono text-slate-400">
                      {displayRow},{col}
                    </div>
                  </div>
                );
              });
            })}
          </div>

          {/* SVG Overlay for 5 Ladders and 7 Snakes */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="ladder3dShadow" x="-20%" y="-20%" width="150%" height="150%">
                <feDropShadow dx="3" dy="5" stdDeviation="3" floodColor="#000000" floodOpacity="0.85" />
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#fbbf24" floodOpacity="0.5" />
              </filter>

              <filter id="snake3dShadow" x="-20%" y="-20%" width="150%" height="150%">
                <feDropShadow dx="4" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.9" />
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.6" />
              </filter>

              <linearGradient id="ladderWoodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="30%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>

              <linearGradient id="rungWoodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              <linearGradient id="snakeSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#15803d" />
                <stop offset="35%" stopColor="#ef4444" />
                <stop offset="70%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
            </defs>

            {/* --- RENDER 5 SLANTED LADDERS --- */}
            {LADDERS.map((ladder) => {
              const start = getSquareCenter(ladder.bottom);
              const end = getSquareCenter(ladder.top);

              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);

              const halfWidth = 12;
              const px = -Math.sin(angle) * halfWidth;
              const py = Math.cos(angle) * halfWidth;

              const rungCount = Math.max(4, Math.floor(length / 26));
              const rungs = [];
              for (let r = 1; r < rungCount; r++) {
                const t = r / rungCount;
                const cx = start.x + dx * t;
                const cy = start.y + dy * t;
                rungs.push({
                  x1: cx - px * 1.05,
                  y1: cy - py * 1.05,
                  x2: cx + px * 1.05,
                  y2: cy + py * 1.05,
                });
              }

              return (
                <g key={ladder.id} filter="url(#ladder3dShadow)">
                  {/* Left Rail */}
                  <line
                    x1={start.x - px}
                    y1={start.y - py}
                    x2={end.x - px}
                    y2={end.y - py}
                    stroke="url(#ladderWoodGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Right Rail */}
                  <line
                    x1={start.x + px}
                    y1={start.y + py}
                    x2={end.x + px}
                    y2={end.y + py}
                    stroke="url(#ladderWoodGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  {/* Rungs */}
                  {rungs.map((rg, rIdx) => (
                    <line
                      key={rIdx}
                      x1={rg.x1}
                      y1={rg.y1}
                      x2={rg.x2}
                      y2={rg.y2}
                      stroke="url(#rungWoodGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  ))}

                  {/* Joint Anchors */}
                  <circle cx={start.x - px} cy={start.y - py} r="4" fill="#b45309" stroke="#fef08a" strokeWidth="1" />
                  <circle cx={start.x + px} cy={start.y + py} r="4" fill="#b45309" stroke="#fef08a" strokeWidth="1" />
                  <circle cx={end.x - px} cy={end.y - py} r="5" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
                  <circle cx={end.x + px} cy={end.y + py} r="5" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
                </g>
              );
            })}

            {/* --- RENDER 7 SERPENT SNAKES --- */}
            {SNAKES.map((snake, idx) => {
              const head = getSquareCenter(snake.head);
              const tail = getSquareCenter(snake.tail);

              const dx = tail.x - head.x;
              const dy = tail.y - head.y;

              const waveDir = idx % 2 === 0 ? 1 : -1;
              const waveIntensity = 45;
              const cp1X = head.x + dx * 0.3 + waveDir * waveIntensity;
              const cp1Y = head.y + dy * 0.25;
              const cp2X = head.x + dx * 0.7 - waveDir * waveIntensity;
              const cp2Y = head.y + dy * 0.75;

              const pathD = `M ${head.x} ${head.y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${tail.x} ${tail.y}`;
              const headAngle = Math.atan2(cp1Y - head.y, cp1X - head.x) * (180 / Math.PI);

              return (
                <g key={snake.id} filter="url(#snake3dShadow)">
                  {/* Underbody */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#450a0a"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  {/* Main Skin */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#snakeSkinGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Scale Pattern */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="3.5"
                    strokeDasharray="4 7"
                    strokeLinecap="round"
                    opacity="0.9"
                  />

                  {/* Tail Rattle */}
                  <circle cx={tail.x} cy={tail.y} r="3.5" fill="#facc15" stroke="#7f1d1d" strokeWidth="1.5" />

                  {/* Snake Head */}
                  <g transform={`translate(${head.x}, ${head.y})`}>
                    {/* Tongue */}
                    <path
                      d="M 0 0 L -12 -3 L -17 -6 M -12 -3 L -17 2"
                      stroke="#ef4444"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                      transform={`rotate(${headAngle})`}
                    />
                    {/* Head Oval */}
                    <ellipse
                      cx="0"
                      cy="0"
                      rx="12"
                      ry="9"
                      fill="url(#snakeSkinGradient)"
                      stroke="#fecaca"
                      strokeWidth="1.8"
                      transform={`rotate(${headAngle})`}
                    />
                    {/* Eyes */}
                    <g transform={`rotate(${headAngle})`}>
                      <circle cx="-2" cy="-4.5" r="2.4" fill="#facc15" stroke="#000" strokeWidth="0.8" />
                      <line x1="-2" y1="-6.5" x2="-2" y2="-2.5" stroke="#000" strokeWidth="1" strokeLinecap="round" />
                      <circle cx="-2" cy="4.5" r="2.4" fill="#facc15" stroke="#000" strokeWidth="0.8" />
                      <line x1="-2" y1="2.5" x2="-2" y2="6.5" stroke="#000" strokeWidth="1" strokeLinecap="round" />
                    </g>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* --- PLAYER TOKENS LAYER (ALL PLAYERS VISIBLE WHEN ON SAME SQUARE) --- */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <AnimatePresence>
              {Array.from(playersBySquare.entries()).map(([squareNum, occupants]) => {
                if (squareNum <= 0) return null; // starting zone handled separately
                const center = getSquareCenter(squareNum);
                const leftPercent = (center.x / 1000) * 100;
                const topPercent = (center.y / 500) * 100;

                const sortedOccupants = [...occupants].sort((a, b) => {
                  if (a.id === currentPlayerId) return 1;
                  if (b.id === currentPlayerId) return -1;
                  return 0;
                });

                const count = sortedOccupants.length;

                // Return all player tokens on this square with distinct non-overlapping offsets
                return sortedOccupants.map((player, pIdx) => {
                  const isCurrentClient = player.id === currentPlayerId;
                  const isMoving = activeMovingPlayerId === player.id;

                  // Compute non-overlapping offset based on occupant count
                  let offsetX = 0;
                  let offsetY = 0;
                  let tokenSizeClass = 'w-6 h-6 sm:w-7 sm:h-7 text-xs';

                  if (count === 2) {
                    offsetX = pIdx === 0 ? -12 : 12;
                    offsetY = pIdx === 0 ? -6 : 6;
                    tokenSizeClass = 'w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs';
                  } else if (count === 3) {
                    if (pIdx === 0) {
                      offsetX = 0;
                      offsetY = -12;
                    } else if (pIdx === 1) {
                      offsetX = -12;
                      offsetY = 9;
                    } else {
                      offsetX = 12;
                      offsetY = 9;
                    }
                    tokenSizeClass = 'w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-[9px] sm:text-[11px]';
                  } else if (count === 4) {
                    offsetX = pIdx % 2 === 0 ? -11 : 11;
                    offsetY = pIdx < 2 ? -10 : 10;
                    tokenSizeClass = 'w-4 h-4 sm:w-5 sm:h-5 text-[8px] sm:text-[10px]';
                  } else if (count >= 5) {
                    const angle = (pIdx / count) * 2 * Math.PI - Math.PI / 2;
                    const radius = 13;
                    offsetX = Math.cos(angle) * radius;
                    offsetY = Math.sin(angle) * radius;
                    tokenSizeClass = 'w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[7px] sm:text-[9px]';
                  }

                  return (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        x: `calc(-50% + ${offsetX}px)`,
                        y: `calc(-50% + ${offsetY}px)`,
                        scale: isMoving ? 1.35 : 1,
                        opacity: 1,
                        zIndex: isMoving ? 50 : isCurrentClient ? 40 : 25 + pIdx,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 280,
                        damping: 24,
                      }}
                      className="absolute pointer-events-auto cursor-pointer"
                      title={`${player.name} (Square ${player.position})${isCurrentClient ? ' - YOU' : ''}`}
                    >
                      <div className="relative flex flex-col items-center">
                        {/* Token Circle */}
                        <div
                          className={`rounded-full flex items-center justify-center font-bold shadow-md border-2 border-white transition-transform ${tokenSizeClass} ${
                            isCurrentClient ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 scale-105' : ''
                          }`}
                          style={{ backgroundColor: player.color }}
                        >
                          <span>{player.avatar}</span>

                          {/* Ping Animation for moving player */}
                          {isMoving && (
                            <span className="absolute -inset-1 rounded-full bg-amber-400 opacity-75 animate-ping" />
                          )}

                          {/* Rank badge if finished */}
                          {player.rank && (
                            <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[7px] font-black w-3 h-3 rounded-full flex items-center justify-center border border-amber-200 shadow">
                              {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
                            </div>
                          )}
                        </div>

                        {/* Name tag shown if 1 or 2 players on square */}
                        {count <= 2 && (
                          <div
                            className={`mt-0.2 px-1 py-0.1 text-[6px] sm:text-[7px] font-bold rounded-full text-white truncate max-w-[45px] sm:max-w-[55px] text-center shadow-sm whitespace-nowrap ${
                              isCurrentClient ? 'bg-amber-600 ring-0.5 ring-amber-300' : 'bg-slate-950/90'
                            }`}
                          >
                            {player.name}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                });
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Starting Zone Shelf (Position 0) - Compact */}
      {startingPlayers.length > 0 && (
        <div className="w-full max-w-[720px] bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-sm mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] font-mono flex-shrink-0">
            <Users className="w-3 h-3" />
            <span>START (0): {startingPlayers.length}</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 flex-1 justify-end scrollbar-none">
            {startingPlayers.map((player) => {
              const isYou = player.id === currentPlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] font-mono ${
                    isYou
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] border border-white"
                    style={{ backgroundColor: player.color }}
                  >
                    <span>{player.avatar}</span>
                  </div>
                  <span className="font-bold truncate max-w-[50px]">{player.name}</span>
                  {isYou && <span className="text-[7px] bg-amber-400 text-slate-950 px-0.5 rounded font-black">YOU</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popover if player clicks a square */}
      {selectedSquareInspect && (
        <div className="w-full max-w-[720px] bg-slate-900 border border-indigo-500/50 rounded-xl p-2.5 shadow-xl flex items-center justify-between mt-1 animate-fadeIn">
          <div>
            <div className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
              SQUARE #{selectedSquareInspect} PLAYERS ({playersBySquare.get(selectedSquareInspect)?.length || 0}):
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {playersBySquare.get(selectedSquareInspect)?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-950 rounded-md border border-slate-800 text-[10px] text-white"
                >
                  <span>{p.avatar}</span>
                  <span className="font-bold">{p.name}</span>
                  {p.id === currentPlayerId && (
                    <span className="text-[8px] text-amber-400 font-mono font-bold">(You)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSquareInspect(null)}
            className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-md"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
