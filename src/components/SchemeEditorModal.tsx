import React, { useState, useEffect } from 'react';
import { RoundCardScheme, CardColor } from '../types';
import { DEFAULT_CARD_SCHEMES } from '../utils/cards';
import { X, Save, RotateCcw, Settings, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface SchemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScheme?: RoundCardScheme[];
  onSaveScheme: (scheme: RoundCardScheme[]) => void;
}

export const SchemeEditorModal: React.FC<SchemeEditorModalProps> = ({
  isOpen,
  onClose,
  currentScheme,
  onSaveScheme,
}) => {
  const [schemes, setSchemes] = useState<RoundCardScheme[]>([]);
  const [activeRoundIndex, setActiveRoundIndex] = useState<number>(0);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (currentScheme && currentScheme.length > 0) {
      setSchemes(JSON.parse(JSON.stringify(currentScheme)));
    } else {
      setSchemes(JSON.parse(JSON.stringify(DEFAULT_CARD_SCHEMES)));
    }
  }, [currentScheme, isOpen]);

  if (!isOpen) return null;

  const currentRound = schemes[activeRoundIndex] || schemes[0];

  const handleCardPointsChange = (color: CardColor, value: string | number) => {
    setSchemes((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (!copy[activeRoundIndex]) return prev;
      const num = Math.max(0, Math.min(50, Math.floor(Number(value) || 0)));
      copy[activeRoundIndex].cards[color].points = num;
      return copy;
    });
  };

  const handleSetCorrectColor = (color: CardColor) => {
    setSchemes((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[activeRoundIndex]) {
        copy[activeRoundIndex].correctColor = color;
      }
      return copy;
    });
  };

  const handleResetToDefault = () => {
    sounds.playClick();
    setSchemes(JSON.parse(JSON.stringify(DEFAULT_CARD_SCHEMES)));
    setActiveRoundIndex(0);
  };

  const handleSave = () => {
    sounds.playClick();
    onSaveScheme(schemes);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleAddRound = () => {
    sounds.playClick();
    setSchemes((prev) => {
      const nextNum = prev.length + 1;
      const newRound: RoundCardScheme = {
        round: nextNum,
        title: `Round ${nextNum}`,
        question: `Round ${nextNum}`,
        cards: {
          RED: { color: 'RED', label: 'RED CARD', text: '', points: 5 },
          BLUE: { color: 'BLUE', label: 'BLUE CARD', text: '', points: 10 },
          GREEN: { color: 'GREEN', label: 'GREEN CARD', text: '', points: 15 },
          YELLOW: { color: 'YELLOW', label: 'YELLOW CARD', text: '', points: 20 },
        },
      };
      return [...prev, newRound];
    });
    setActiveRoundIndex(schemes.length);
  };

  const handleDeleteRound = (index: number) => {
    if (schemes.length <= 1) return;
    sounds.playClick();
    const filtered = schemes.filter((_, i) => i !== index).map((r, i) => ({ ...r, round: i + 1 }));
    setSchemes(filtered);
    setActiveRoundIndex(Math.max(0, index - 1));
  };

  const cardColorThemes: Record<CardColor, { border: string; bg: string; titleColor: string; badge: string }> = {
    RED: { border: 'border-red-500/50', bg: 'bg-red-950/30', titleColor: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
    BLUE: { border: 'border-blue-500/50', bg: 'bg-blue-950/30', titleColor: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    GREEN: { border: 'border-emerald-500/50', bg: 'bg-emerald-950/30', titleColor: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    YELLOW: { border: 'border-amber-500/50', bg: 'bg-amber-950/30', titleColor: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  };

  const colors: CardColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

  return (
    <div
      id="scheme-editor-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Card Scheme & Hidden Points Editor</span>
              </h2>
              <p className="text-[10px] text-slate-400">Configure hidden points and correct answer card for each round</p>
            </div>
          </div>

          <button
            id="close-scheme-editor-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Round Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-900/90 overflow-x-auto scrollbar-none">
          {schemes.map((scheme, idx) => (
            <button
              key={scheme.round}
              type="button"
              onClick={() => setActiveRoundIndex(idx)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeRoundIndex === idx
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>Round {scheme.round}</span>
              {schemes.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRound(idx);
                  }}
                  className="hover:text-rose-400 p-0.5"
                  title="Delete round"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          ))}

          <button
            type="button"
            onClick={handleAddRound}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 text-indigo-400 hover:text-indigo-300 font-mono text-xs flex items-center gap-1 flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Add Round</span>
          </button>
        </div>

        {/* Modal Body - 4 Colored Cards Point Configuration for Active Round */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {currentRound && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Round {currentRound.round} Card Points Configuration:
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Players receive points based on chosen card color
                </span>
              </div>

              {/* 4 Cards Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colors.map((color) => {
                  const card = currentRound.cards[color];
                  const theme = cardColorThemes[color];
                  const isCorrect = currentRound.correctColor === color;

                  return (
                    <div
                      key={color}
                      className={`p-3 rounded-xl border ${theme.border} ${theme.bg} space-y-2.5 flex flex-col justify-between`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-mono font-black uppercase ${theme.titleColor}`}>
                          {color} CARD
                        </span>

                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-mono text-slate-400 uppercase">Points:</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={card.points}
                            onChange={(e) => handleCardPointsChange(color, e.target.value)}
                            className="w-16 bg-slate-950 border border-slate-700 text-amber-400 font-mono font-black text-xs px-2 py-1 rounded-lg text-center focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-400">
                          Target / Best Answer:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSetCorrectColor(color)}
                          className={`px-2 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 transition-all ${
                            isCorrect
                              ? 'bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-500/40 ring-1 ring-emerald-300'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700'
                          }`}
                          title="Mark this card as the correct answer for post-game statistics"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isCorrect ? 'Correct Answer ✓' : 'Mark Correct'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/90 gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
            >
              Cancel
            </button>

            <button
              id="save-scheme-btn"
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Scheme</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
