import React from 'react';
import { Volume2, VolumeX, QrCode, BookOpen, LogOut, Dices, RotateCcw, Settings2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  roomId: string;
  roundNumber: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenQR: () => void;
  onOpenRules: () => void;
  onLeaveRoom: () => void;
  isAdmin: boolean;
  onResetGame?: () => void;
  onOpenSchemeEditor?: () => void;
  gameStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  roundNumber,
  isMuted,
  onToggleMute,
  onOpenQR,
  onOpenRules,
  onLeaveRoom,
  isAdmin,
  onResetGame,
  onOpenSchemeEditor,
  gameStatus,
}) => {
  return (
    <header className="w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-3 py-1.5 flex-shrink-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand / Room Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 p-0.5 shadow flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center text-amber-400">
              <Dices className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-black text-white tracking-tight">
                SNAKES & LADDERS
              </span>
              <span className="bg-amber-500/10 text-amber-400 px-1 py-0.2 rounded text-[8px] font-mono font-bold border border-amber-500/20">
                50 SQUARES
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
              <span>CODE: <strong className="text-amber-400 font-bold">{roomId}</strong></span>
              {gameStatus === 'playing' && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-indigo-400 font-bold">R{roundNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1">
          {/* Admin Edit Scheme Button */}
          {isAdmin && onOpenSchemeEditor && (
            <button
              id="header-edit-scheme-btn"
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenSchemeEditor();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold transition-all active:scale-95"
              title="Edit Card Scheme"
            >
              <Settings2 className="w-3 h-3" />
              <span className="hidden sm:inline">Scheme</span>
            </button>
          )}

          {/* Admin Start New Match Button */}
          {isAdmin && onResetGame && (
            <button
              id="header-start-new-match-btn"
              type="button"
              onClick={() => {
                sounds.playClick();
                onResetGame();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 text-slate-950 font-black text-[10px] font-mono uppercase tracking-tight shadow transition-all active:scale-95"
              title="Start New Match"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">New Match</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="mute-toggle-btn"
            type="button"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border transition-all ${
              isMuted
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* QR Code trigger */}
          <button
            id="header-qr-btn"
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenQR();
            }}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-all shadow-xs"
            title="Room QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>

          {/* Rules trigger */}
          <button
            id="header-rules-btn"
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenRules();
            }}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 transition-all shadow-xs"
            title="Rules"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          {/* Leave Match */}
          <button
            id="leave-match-btn"
            type="button"
            onClick={() => {
              sounds.playClick();
              onLeaveRoom();
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Leave Match"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
