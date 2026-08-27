import React from 'react';
import { X, BookOpen, Dices } from 'lucide-react';
import { SNAKES, LADDERS, BOARD_SIZE } from '../utils/board';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="rules-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
          <div className="flex items-center gap-2 text-white font-bold text-base uppercase tracking-wider">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>RULES & BOARD MATRIX</span>
          </div>
          <button
            id="close-rules-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div>
            <h4 className="font-bold text-white mb-1 font-mono uppercase text-xs">
              🎯 OBJECTIVE & BOARD SETUP:
            </h4>
            <p className="text-slate-400">
              The board consists of exactly <b>{BOARD_SIZE} numbered squares</b>. All players race from outside square 1 to reach <b>Square {BOARD_SIZE}</b> first!
            </p>
          </div>

          {/* Color Card Selection Rule */}
          <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/30">
            <h4 className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1 font-mono text-xs uppercase">
              <Dices className="w-4 h-4 text-amber-400" />
              <span>🎴 INTERACTIVE COLOR CARDS (30S TIMER):</span>
            </h4>
            <p className="text-slate-300 text-xs">
              Each round, the host reveals the colored cards for all players. Choose between <b>RED, BLUE, GREEN, or YELLOW</b> within <b>30 seconds</b>. Each color awards hidden points to advance your avatar along the 50-square board!
            </p>
          </div>

          {/* Ladders Table */}
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-2 font-mono text-xs uppercase">
              <span>🪜 5 GOLDEN LADDERS (CLIMB UP):</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs font-mono">
              {LADDERS.map((ladder, idx) => (
                <div key={ladder.id} className="p-2 bg-slate-950 rounded-xl font-bold border border-slate-800">
                  <div className="text-amber-400">Ladder #{idx + 1}</div>
                  <div className="text-white text-sm">
                    {ladder.bottom} → <span className="text-amber-400 font-bold">{ladder.top}</span>
                  </div>
                  <div className="text-[10px] text-amber-400/80">+{ladder.top - ladder.bottom} Squares</div>
                </div>
              ))}
            </div>
          </div>

          {/* Snakes Table */}
          <div className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/30">
            <h4 className="font-bold text-rose-400 flex items-center gap-1.5 mb-2 font-mono text-xs uppercase">
              <span>🐍 7 SLY SNAKES (SLIDE DOWN):</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              {SNAKES.map((snake, idx) => (
                <div key={snake.id} className="p-2 bg-slate-950 rounded-xl font-bold border border-slate-800">
                  <div className="text-rose-400">Snake #{idx + 1}</div>
                  <div className="text-white text-sm">
                    {snake.head} → <span className="text-rose-400 font-bold">{snake.tail}</span>
                  </div>
                  <div className="text-[10px] text-rose-400/80">-{snake.head - snake.tail} Squares</div>
                </div>
              ))}
            </div>
          </div>

          {/* New Match Flow Rule */}
          <div>
            <h4 className="font-bold text-white mb-1 font-mono uppercase text-xs">
              📱 NEW MATCH QR SCANNING:
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs">
              <li>When the match host starts a new match, previous player sessions are deleted.</li>
              <li>Only players who scan the fresh QR code on their smartphone camera will be added to the match roster.</li>
              <li>Once the host starts the match, each player enters their dice on the same screen as the board and presses Enter.</li>
            </ul>
          </div>
        </div>

        <button
          id="rules-understood-btn"
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 text-slate-950 font-black uppercase tracking-tight rounded-xl shadow-lg"
        >
          Got It!
        </button>
      </div>
    </div>
  );
};
