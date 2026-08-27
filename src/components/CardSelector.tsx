import React, { useState, useEffect } from 'react';
import { CardColor, RoundCardScheme } from '../types';
import { getRoundCardScheme } from '../utils/cards';
import { sounds } from '../utils/audio';
import { Play, Timer, Check, Sparkles, Clock, Eye, EyeOff } from 'lucide-react';

interface CardSelectorProps {
  roundNumber: number;
  roundPhase: 'waiting_for_host' | 'cards_revealed' | 'animating' | 'round_resolved';
  timerExpiresAt: number | null;
  cardScheme?: RoundCardScheme[];
  isAdmin: boolean;
  hasSubmitted: boolean;
  selectedCardColor: CardColor | null;
  pendingRoll: number | null;
  lastCardColor: CardColor | null;
  disabled?: boolean;
  onRevealCards: () => void;
  onSelectCard: (color: CardColor) => void;
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  roundNumber,
  roundPhase,
  timerExpiresAt,
  cardScheme,
  isAdmin,
  hasSubmitted,
  selectedCardColor,
  disabled = false,
  onRevealCards,
  onSelectCard,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [showPointsPreview, setShowPointsPreview] = useState<boolean>(false);

  const scheme = getRoundCardScheme(cardScheme, roundNumber);

  // 30s Countdown timer sync with server timerExpiresAt
  useEffect(() => {
    if (roundPhase === 'cards_revealed' && timerExpiresAt) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((timerExpiresAt - Date.now()) / 1000));
        setTimeLeft(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 200);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(30);
    }
  }, [roundPhase, timerExpiresAt]);

  const handleCardClick = (color: CardColor) => {
    if (disabled || hasSubmitted || roundPhase !== 'cards_revealed' || timeLeft <= 0) return;
    sounds.playClick();
    onSelectCard(color);
  };

  const cardConfig: Record<CardColor, {
    bg: string;
    border: string;
    glow: string;
    text: string;
    badge: string;
    iconColor: string;
    hex: string;
  }> = {
    RED: {
      bg: 'bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600',
      border: 'border-red-400/80',
      glow: 'shadow-red-500/30',
      text: 'text-red-100',
      badge: 'bg-red-500/40 text-white border-red-300/50',
      iconColor: 'text-red-200',
      hex: '#ef4444',
    },
    BLUE: {
      bg: 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600',
      border: 'border-blue-400/80',
      glow: 'shadow-blue-500/30',
      text: 'text-blue-100',
      badge: 'bg-blue-500/40 text-white border-blue-300/50',
      iconColor: 'text-blue-200',
      hex: '#3b82f6',
    },
    GREEN: {
      bg: 'bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600',
      border: 'border-emerald-400/80',
      glow: 'shadow-emerald-500/30',
      text: 'text-emerald-100',
      badge: 'bg-emerald-500/40 text-white border-emerald-300/50',
      iconColor: 'text-emerald-200',
      hex: '#10b981',
    },
    YELLOW: {
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500',
      border: 'border-amber-400/80',
      glow: 'shadow-amber-500/30',
      text: 'text-amber-100',
      badge: 'bg-amber-500/40 text-white border-amber-300/50',
      iconColor: 'text-amber-200',
      hex: '#f59e0b',
    },
  };

  const colorsList: CardColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

  return (
    <div
      id="interactive-cards-container"
      className="w-full max-w-[720px] bg-slate-900/95 border border-slate-800 rounded-xl p-2 sm:p-2.5 shadow-xl flex-shrink-0 select-none flex flex-col gap-1.5"
    >
      {/* State 1: Waiting for Host to reveal cards */}
      {roundPhase === 'waiting_for_host' && (
        <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                Round {roundNumber}: Select a Card Color
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {isAdmin ? 'Ready to reveal colored cards to all players' : 'Waiting for Host to show colored cards...'}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <button
              id="host-show-cards-btn"
              type="button"
              onClick={onRevealCards}
              disabled={disabled}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>SHOW CARDS (30s)</span>
            </button>
          ) : (
            <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 flex items-center gap-1 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Stand by</span>
            </div>
          )}
        </div>
      )}

      {/* State 2: Cards Revealed / Selection in Progress */}
      {roundPhase === 'cards_revealed' && (
        <div className="space-y-1.5">
          {/* Header Row: Pick Color Instruction + 30s Countdown Timer */}
          <div className="flex items-center justify-between gap-2 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/30 flex-shrink-0">
                  R{roundNumber}
                </span>
                <p className="text-[11px] sm:text-xs font-bold text-slate-200 truncate">
                  Pick your card color!
                </p>
              </div>
            </div>

            {/* Countdown Timer Badge & Peek button */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowPointsPreview(!showPointsPreview)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1 border border-slate-700"
                  title="Toggle Host Points Visibility"
                >
                  {showPointsPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span className="hidden sm:inline">{showPointsPreview ? 'Hide' : 'Peek'}</span>
                </button>
              )}

              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-black text-xs border shadow-inner ${
                  timeLeft <= 5
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                    : timeLeft <= 10
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Submission status banner if locked */}
          {hasSubmitted && selectedCardColor && (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-mono">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>
                  LOCKED IN:{' '}
                  <strong className="font-black underline uppercase">
                    {selectedCardColor} CARD
                  </strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Waiting for other players or timer...</span>
            </div>
          )}

          {/* 4 Interactive Colored Cards (Color-Only Interface) */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {colorsList.map((color) => {
              const cardData = scheme.cards[color];
              const conf = cardConfig[color];
              const isSelected = selectedCardColor === color;

              return (
                <button
                  key={color}
                  id={`card-choice-${color.toLowerCase()}`}
                  type="button"
                  onClick={() => handleCardClick(color)}
                  disabled={disabled || hasSubmitted || timeLeft <= 0}
                  className={`relative p-3 sm:p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all duration-150 shadow-md ${
                    conf.bg
                  } ${conf.border} ${
                    isSelected
                      ? 'ring-4 ring-white shadow-xl scale-[1.02] brightness-110 z-10'
                      : hasSubmitted
                      ? 'opacity-40 grayscale-[40%]'
                      : 'hover:scale-[1.02] hover:brightness-105 active:scale-95'
                  }`}
                >
                  {/* Card Color Title Banner */}
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm sm:text-base font-mono font-black uppercase text-white tracking-wider drop-shadow-md">
                      {color} CARD
                    </span>
                  </div>

                  {/* Hidden points badge or Peek points for admin */}
                  <div className="mt-0.5">
                    {isAdmin && showPointsPreview ? (
                      <span className="text-[10px] font-mono font-bold bg-black/50 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                        +{cardData.points} PTS
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-white/80 bg-black/30 px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Hidden Points</span>
                      </span>
                    )}
                  </div>

                  {/* Checked indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg font-black">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* State 3: Animating Moves */}
      {roundPhase === 'animating' && (
        <div className="flex items-center justify-center gap-2 p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-indigo-200 font-mono text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
          <span>REVEALING SCORES & MOVING PLAYERS ON BOARD...</span>
        </div>
      )}
    </div>
  );
};
