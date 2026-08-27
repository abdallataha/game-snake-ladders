import React, { useState, useEffect, useRef } from 'react';
import { CornerDownLeft, RefreshCw, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface DiceRollerProps {
  hasSubmitted: boolean;
  lastRoll: number | null;
  pendingRoll: number | null;
  roundNumber: number;
  disabled?: boolean;
  onSubmitRoll: (roll: number) => void;
  playerColor?: string;
  playerName?: string;
  currentPosition?: number;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  hasSubmitted,
  pendingRoll,
  roundNumber,
  disabled = false,
  onSubmitRoll,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasSubmitted) {
      setInputValue('');
      // Auto focus on new round
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [roundNumber, hasSubmitted]);

  const handleSubmit = () => {
    if (disabled || hasSubmitted) return;

    const trimmed = inputValue.trim();
    if (trimmed === '') return;

    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) return;

    const finalNum = Math.max(0, Math.min(20, parsed));

    sounds.playClick();
    onSubmitRoll(finalNum);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || hasSubmitted) return;
    setInputValue(e.target.value);
  };

  const isValidNumber = inputValue.trim() !== '' && !isNaN(parseInt(inputValue.trim(), 10));

  return (
    <div
      id="dice-entry-container"
      className="w-full max-w-[720px] bg-slate-900 border border-slate-800 rounded-xl p-1.5 sm:p-2 shadow-md flex-shrink-0 select-none"
    >
      {hasSubmitted ? (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5 font-mono text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-black">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>
              ROUND {roundNumber} MOVE LOCKED:{' '}
              <strong className="text-amber-400 font-black text-sm bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                {pendingRoll ?? 0} PTS
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-400" />
            <span className="hidden sm:inline">Waiting for round...</span>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-1.5 w-full"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="dice-points-input"
              type="number"
              min="0"
              max="20"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter dice number (0-20) & press Enter..."
              disabled={disabled}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-amber-400 placeholder:text-slate-500 font-mono font-bold text-sm px-3 py-2 rounded-lg focus:outline-none shadow-inner"
            />
          </div>

          <button
            id="dice-submit-btn"
            type="submit"
            disabled={disabled || !isValidNumber}
            className={`h-9 px-4 rounded-lg font-mono font-black uppercase text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all flex-shrink-0 ${
              isValidNumber
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <span>ENTER</span>
            <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </form>
      )}
    </div>
  );
};
