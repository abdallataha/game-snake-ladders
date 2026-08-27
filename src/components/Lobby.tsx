import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Play, Copy, Check, Users, Sparkles, Shield, QrCode, Search, ExternalLink, Settings2 } from 'lucide-react';
import { Player, RoomState } from '../types';
import { sounds } from '../utils/audio';

interface LobbyProps {
  roomState: RoomState;
  currentPlayerId: string | null;
  isAdmin: boolean;
  onStartGame: () => void;
  onToggleReady: () => void;
  onKickPlayer?: (playerId: string) => void;
  onOpenSchemeEditor?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomState,
  currentPlayerId,
  isAdmin,
  onStartGame,
  onKickPlayer,
  onOpenSchemeEditor,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate join URL
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomState.roomId}`
    : `https://snakesandladders.app/?room=${roomState.roomId}`;

  const handleCopyLink = () => {
    sounds.playClick();
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playersList: Player[] = Object.values(roomState.players);
  const filteredPlayers = playersList.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="game-lobby-view"
      className="max-w-5xl mx-auto w-full space-y-4 animate-fadeIn"
    >
      {/* Top Banner / Match Code Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-mono font-bold text-xs rounded-full uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>INTERACTIVE COLOR CARDS ARENA • UP TO 50 PLAYERS</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {roomState.roomName}
        </h2>
        <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1 font-mono">
          Each player scans the QR code on their smartphone camera, joins the arena, and picks RED, BLUE, GREEN, or YELLOW cards each round within 30 seconds!
        </p>

        {/* Room Code & Quick Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-3">
          <div className="flex items-center bg-slate-950 rounded-xl px-3.5 py-1.5 border border-slate-800">
            <span className="text-xs text-slate-400 font-mono font-medium mr-2">ROOM CODE:</span>
            <span className="text-lg sm:text-xl font-mono font-black text-amber-400 tracking-widest">
              {roomState.roomId}
            </span>
          </div>

          <button
            id="copy-join-link-btn"
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-700 transition-all active:scale-95 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'LINK COPIED' : 'COPY MATCH LINK'}</span>
          </button>

          {/* Edit Scheme Button for Host */}
          {isAdmin && onOpenSchemeEditor && (
            <button
              id="lobby-edit-scheme-btn"
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenSchemeEditor();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-mono font-bold rounded-xl border border-indigo-500/40 transition-all active:scale-95 shadow-sm"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>Edit scheme</span>
            </button>
          )}

          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-2 text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            <span>OPEN 2ND PLAYER TAB</span>
          </a>
        </div>
      </div>

      {/* Main Grid: QR Code Scan Card & Connected Players Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* QR Code Scan Card */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-xs uppercase tracking-wider mb-2.5">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>SCAN WITH SMARTPHONE CAMERA</span>
          </div>

          {/* QR Code Graphic with high contrast */}
          <div
            onClick={() => setShowQRFullscreen(!showQRFullscreen)}
            className="p-2.5 bg-white rounded-2xl shadow-md border-2 border-slate-700 hover:scale-105 transition-transform cursor-pointer relative group"
            title="Click to expand QR Code"
          >
            <QRCodeSVG
              value={joinUrl}
              size={175}
              level="H"
              includeMargin={true}
            />
            <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] bg-slate-950 text-white px-2 py-1 rounded font-bold font-mono">
                Tap to Expand
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-mono mt-2.5 max-w-[240px]">
            Scan to enter name & choose color cards live on your smartphone!
          </p>

          {/* Live Capacity Tracker */}
          <div className="mt-3 w-full pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">PLAYERS JOINED</span>
            <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs">
              {playersList.length} / 50 ACTIVE
            </span>
          </div>
        </div>

        {/* Players List & Match Start Panel */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3.5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5 font-mono">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wide">
                  ACTIVE PLAYERS ROSTER ({playersList.length})
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">
                50 SQUARES ARENA
              </span>
            </div>

            {/* Search filter if many players */}
            {playersList.length > 6 && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter players by name..."
                  className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            )}

            {/* Players Roster Grid supporting 20+ players gracefully */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
              {filteredPlayers.map((player) => {
                const isYou = player.id === currentPlayerId;
                return (
                  <div
                    key={player.id}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                      isYou
                        ? 'bg-slate-800/90 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Avatar Circle */}
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm shadow border border-white"
                        style={{ backgroundColor: player.color }}
                      >
                        <span>{player.avatar}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-white truncate max-w-[90px]">
                            {player.name}
                          </span>
                          {isYou && (
                            <span className="text-[8px] bg-indigo-500/30 text-indigo-300 px-1 py-0.2 rounded font-bold font-mono">
                              YOU
                            </span>
                          )}
                          {player.isAdmin && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-bold font-mono flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" /> HOST
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {player.connected ? '🟢 Ready' : '🔴 Disconnected'}
                        </span>
                      </div>
                    </div>

                    {isAdmin && !player.isAdmin && onKickPlayer && (
                      <button
                        type="button"
                        onClick={() => onKickPlayer(player.id)}
                        className="text-[9px] font-mono text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-rose-500/10 uppercase"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer: Admin Start Match */}
          <div className="pt-2.5 border-t border-slate-800">
            {isAdmin ? (
              <div className="space-y-1.5">
                <button
                  id="admin-start-game-btn"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onStartGame();
                  }}
                  disabled={playersList.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 hover:opacity-95 text-slate-950 font-black uppercase tracking-tight text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>START MATCH NOW ({playersList.length} PLAYERS)</span>
                </button>
                <p className="text-center text-[10px] text-slate-400 font-mono">
                  All joined devices will immediately receive the 50-square arena and round cards!
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-1 font-mono">
                <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-indigo-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1" />
                  <span>Waiting for match host to start the game...</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Your screen will automatically open your personalized card selector and 50-square arena!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
