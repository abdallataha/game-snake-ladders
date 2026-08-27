import React, { useState, useEffect } from 'react';
import { Play, Sparkles, QrCode, Dices, UserPlus, LogIn } from 'lucide-react';
import { sounds } from '../utils/audio';

interface WelcomeScreenProps {
  initialRoomCode?: string;
  onCreateRoom: (playerName: string, avatar?: string, color?: string) => void;
  onJoinRoom: (roomId: string, playerName: string, avatar?: string, color?: string) => void;
  isLoading?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  initialRoomCode = '',
  onCreateRoom,
  onJoinRoom,
  isLoading = false,
}) => {
  const [mode, setMode] = useState<'join' | 'create'>(initialRoomCode ? 'join' : 'create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
      setMode('join');
    }
  }, [initialRoomCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    sounds.playClick();

    if (mode === 'create') {
      onCreateRoom(playerName.trim());
    } else {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div
      id="welcome-join-screen"
      className="max-w-md mx-auto w-full p-3 sm:p-4 my-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 text-slate-950 shadow-lg shadow-rose-500/20">
            <Dices className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            SNAKES & LADDERS LIVE
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            50 SQUARES • 5 LADDERS • 7 SNAKES • UP TO 50 PLAYERS
          </p>
        </div>

        {/* Mode Selector (Host vs Join) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs">
          <button
            id="tab-create-room-btn"
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('create');
            }}
            className={`py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'create'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>HOST MATCH</span>
          </button>
          <button
            id="tab-join-room-btn"
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('join');
            }}
            className={`py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'join'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>JOIN MATCH</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Room Code field if Join Mode */}
          {mode === 'join' && (
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                ROOM CODE (5 LETTERS)
              </label>
              <input
                id="join-room-code-input"
                type="text"
                required
                maxLength={8}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7KX92"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-black text-center tracking-widest text-base sm:text-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none uppercase"
              />
            </div>
          )}

          {/* Player Name */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
              {mode === 'create' ? 'HOST NICKNAME' : 'YOUR NICKNAME'}
            </label>
            <input
              id="player-name-input"
              type="text"
              required
              maxLength={18}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your nickname..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
            />
            <p className="text-[9px] text-slate-500 font-mono mt-1">
              ✨ Unique avatar emoji & distinct color will be assigned to you automatically!
            </p>
          </div>

          {/* Submit Action */}
          <button
            id="welcome-submit-btn"
            type="submit"
            disabled={isLoading || !playerName.trim() || (mode === 'join' && !roomCode.trim())}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 hover:opacity-95 text-slate-950 font-black uppercase tracking-tight text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>
              {mode === 'create' ? 'CREATE MATCH & SHOW QR CODE' : 'ENTER MATCH ARENA'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
