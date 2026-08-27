import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw } from 'lucide-react';
import { Player, CardColor } from '../types';
import { sounds } from '../utils/audio';
import { BOARD_SIZE } from '../utils/board';

interface LeaderboardProps {
  players: Player[];
  currentPlayerId: string | null;
  isAdmin: boolean;
  isGameOver: boolean;
  onRestartGame?: () => void;
  onOpenCelebrationModal?: () => void;
  totalRounds?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  currentPlayerId,
  isAdmin,
  isGameOver,
  onRestartGame,
  onOpenCelebrationModal,
  totalRounds = 5,
}) => {
  // Sort players by finished rank, then position descending, then correct answers, then ladders climbed
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    if (b.position !== a.position) return b.position - a.position;
    if ((b.correctAnswersCount || 0) !== (a.correctAnswersCount || 0)) {
      return (b.correctAnswersCount || 0) - (a.correctAnswersCount || 0);
    }
    return b.laddersClimbedCount - a.laddersClimbedCount;
  });

  useEffect(() => {
    if (isGameOver) {
      sounds.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isGameOver]);

  const cardBadgeColor: Record<CardColor, string> = {
    RED: 'bg-red-500/20 text-red-300 border-red-500/30',
    BLUE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    GREEN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    YELLOW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <div
      id="leaderboard-panel"
      className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col flex-1 min-h-0 w-full"
    >
      {/* Header */}
      <div className="bg-indigo-600/20 px-3 py-2 border-b border-indigo-500/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-300">
            {isGameOver ? 'FINAL RANKINGS' : `RANKINGS (${players.length} PLAYERS)`}
          </span>
        </div>
        {isGameOver && (
          <button
            type="button"
            onClick={onOpenCelebrationModal}
            className="text-[9px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase shadow flex items-center gap-1 transition-all active:scale-95"
          >
            <span>🏆 STATS & PODIUM</span>
          </button>
        )}
      </div>

      {/* The ONLY scrollable element on screen */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {sortedPlayers.map((player, idx) => {
          const isYou = player.id === currentPlayerId;
          const rank = player.rank || idx + 1;
          const isWinner = player.position === BOARD_SIZE;

          return (
            <div
              key={player.id}
              className={`p-1.5 rounded-xl border flex items-center justify-between transition-all ${
                isYou
                  ? 'bg-slate-800/95 border-amber-400/60 ring-1 ring-amber-400/40'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              {/* Rank & Player Info */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-4 text-center font-mono font-bold text-[10px] text-slate-500 flex-shrink-0">
                  #{rank}
                </span>
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs border border-white shadow-xs"
                  style={{ backgroundColor: player.color }}
                >
                  <span>{player.avatar}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 leading-tight">
                    <span className={`text-xs font-bold truncate max-w-[90px] sm:max-w-[120px] ${isYou ? 'text-amber-300' : 'text-slate-200'}`}>
                      {player.name}
                    </span>
                    {isYou && (
                      <span className="text-[7px] bg-amber-400 text-slate-950 px-1 rounded font-black font-mono">
                        YOU
                      </span>
                    )}
                    {player.isAdmin && (
                      <span className="text-[7px] bg-indigo-500/30 text-indigo-300 px-1 rounded font-bold font-mono">
                        HOST
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[8px] text-slate-400 font-mono mt-0.5">
                    {player.averageResponseTime > 0 && (
                      <span className="text-amber-300 font-bold" title="Average decision time">
                        ⚡ {player.averageResponseTime}s
                      </span>
                    )}
                    <span className="text-emerald-400 font-bold" title="Correct answers chosen">
                      🎯 {player.correctAnswersCount || 0}/{totalRounds}✓
                    </span>
                    <span className="text-rose-400">🐍 {player.snakesHitCount}</span>
                    <span className="text-amber-400">🪜 {player.laddersClimbedCount}</span>
                    {player.lastCardColor && (
                      <span className={`px-1 py-0.2 rounded border text-[7px] font-bold ${cardBadgeColor[player.lastCardColor]}`}>
                        {player.lastCardColor}
                      </span>
                    )}
                    {player.lastRoll !== null && <span className="text-amber-300 font-bold">+{player.lastRoll}</span>}
                  </div>
                </div>
              </div>

              {/* Square Progress */}
              <div className="flex flex-col items-end font-mono flex-shrink-0 ml-2">
                <span className={`text-xs font-black italic ${isWinner ? 'text-amber-400' : 'text-slate-300'}`}>
                  {player.position} <span className="text-[8px] text-slate-500 font-normal">/{BOARD_SIZE}</span>
                </span>
                <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full rounded-full ${
                      isWinner ? 'bg-amber-400' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${(player.position / BOARD_SIZE) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start New Match / Rematch Controls if Game Over or Admin */}
      {isGameOver && (
        <div className="p-2 border-t border-slate-800 flex flex-col gap-1.5 flex-shrink-0 bg-slate-950/60">
          {onOpenCelebrationModal && (
            <button
              id="view-celebration-btn"
              type="button"
              onClick={onOpenCelebrationModal}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-[11px] rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>VIEW CELEBRATION & STATS</span>
            </button>
          )}

          {isAdmin && onRestartGame && (
            <button
              id="admin-rematch-btn"
              type="button"
              onClick={() => {
                sounds.playClick();
                onRestartGame();
              }}
              className="w-full py-2 bg-gradient-to-r from-amber-400 to-indigo-600 text-slate-950 font-black uppercase text-xs rounded-xl shadow flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>START NEW MATCH</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
