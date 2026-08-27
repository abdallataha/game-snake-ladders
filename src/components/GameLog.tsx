import React from 'react';
import { ScrollText, Sparkles, ShieldAlert } from 'lucide-react';
import { GameLogEntry } from '../types';

interface GameLogProps {
  logs: GameLogEntry[];
  currentPlayerId: string | null;
}

export const GameLog: React.FC<GameLogProps> = ({ logs, currentPlayerId }) => {
  return (
    <div
      id="game-action-log"
      className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full"
    >
      {/* Header with Artistic Flair rose accent */}
      <div className="bg-rose-500/5 px-4 py-3 border-b border-rose-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-rose-400" />
          <h3 className="text-[11px] font-mono font-bold tracking-widest uppercase text-rose-400">
            DICE & MATCH LOG
          </h3>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
          {logs.length} EVENTS
        </span>
      </div>

      {/* Log Feed */}
      <div className="p-4 flex-1 overflow-y-auto space-y-2 pr-1 max-h-56">
        {logs.length === 0 ? (
          <div className="text-center py-6 font-mono text-xs text-slate-500">
            &gt; Awaiting initial dice roll...
          </div>
        ) : (
          logs.map((log) => {
            const isYou = log.playerId === currentPlayerId;
            const isLadder = log.specialEvent === 'ladder';
            const isSnake = log.specialEvent === 'snake';
            const isWin = log.specialEvent === 'win';

            return (
              <div
                key={log.id}
                className={`p-2 rounded-xl text-xs border transition-all font-mono ${
                  isWin
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : isLadder
                    ? 'bg-amber-500/5 border-amber-500/30 text-amber-300'
                    : isSnake
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : isYou
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-sm">{log.playerAvatar}</span>
                    <span className="text-white truncate max-w-[110px]">
                      {log.playerName}
                      {isYou && ' (You)'}
                    </span>
                    {log.roll > 0 && (
                      <span className="px-1.5 py-0.2 bg-slate-800 rounded text-[10px] font-mono text-amber-400 font-bold">
                        🎲 {log.roll}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    R{log.round}
                  </span>
                </div>

                <div className="text-slate-300 leading-tight text-[11px]">
                  &gt; {log.message}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
