import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RoomState, ServerMessage, CardColor, RoundCardScheme } from './types';
import { Board } from './components/Board';
import { CardSelector } from './components/CardSelector';
import { Leaderboard } from './components/Leaderboard';
import { Lobby } from './components/Lobby';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Header } from './components/Header';
import { RulesModal } from './components/RulesModal';
import { QRModal } from './components/QRModal';
import { SchemeEditorModal } from './components/SchemeEditorModal';
import { PostGameCelebrationModal } from './components/PostGameCelebrationModal';
import { sounds } from './utils/audio';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [initialUrlRoom, setInitialUrlRoom] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isQROpen, setIsQROpen] = useState<boolean>(false);
  const [isSchemeEditorOpen, setIsSchemeEditorOpen] = useState<boolean>(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [activeMovingPlayerId, setActiveMovingPlayerId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sound mute state & URL params
  useEffect(() => {
    setIsMuted(sounds.getMuted());

    // Check URL parameters for ?room=XYZ
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialUrlRoom(roomParam.toUpperCase().trim());
    }

    // Check existing stored session
    const savedRoomId = sessionStorage.getItem('sl_room_id');
    const savedPlayerId = sessionStorage.getItem('sl_player_id');
    if (savedRoomId && savedPlayerId) {
      setRoomId(savedRoomId);
      setPlayerId(savedPlayerId);
    }
  }, []);

  // Handle server message payloads
  const handleServerMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'JOIN_SUCCESS': {
        setRoomId(msg.payload.roomId);
        setPlayerId(msg.payload.playerId);
        setRoomState(msg.payload.state);
        sessionStorage.setItem('sl_room_id', msg.payload.roomId);
        sessionStorage.setItem('sl_player_id', msg.payload.playerId);
        break;
      }

      case 'ROOM_STATE': {
        const state = msg.payload;
        setRoomState(state);

        // Check if current player was cleared due to new match reset
        const currentSavedPlayerId = sessionStorage.getItem('sl_player_id');
        if (currentSavedPlayerId && state.status === 'lobby' && !state.players[currentSavedPlayerId]) {
          sessionStorage.removeItem('sl_player_id');
          setPlayerId(null);
          setErrorMessage('New match started! Please scan the QR code to join the new match.');
        }
        break;
      }

      case 'ANIMATE_MOVE': {
        const { playerId: movingId, steps } = msg.payload;
        setActiveMovingPlayerId(movingId);

        // Play sounds per step
        steps.forEach((step, idx) => {
          setTimeout(() => {
            if (step.type === 'roll') {
              sounds.playStep();
            } else if (step.type === 'ladder') {
              sounds.playLadderClimb();
            } else if (step.type === 'snake') {
              sounds.playSnakeBite();
            }
          }, idx * 400);
        });

        setTimeout(() => {
          setActiveMovingPlayerId(null);
        }, steps.length * 400 + 400);
        break;
      }

      case 'ERROR': {
        setErrorMessage(msg.payload.message);
        setTimeout(() => setErrorMessage(null), 5000);
        break;
      }
    }
  }, []);

  // HTTP Fallback to fetch room state
  const fetchRoomStateFallback = useCallback(async (targetRoomId: string) => {
    try {
      const res = await fetch(`/api/room/${targetRoomId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          const state: RoomState = data.state;
          setRoomState(state);

          const currentSavedPlayerId = sessionStorage.getItem('sl_player_id');
          if (currentSavedPlayerId && state.status === 'lobby' && !state.players[currentSavedPlayerId]) {
            sessionStorage.removeItem('sl_player_id');
            setPlayerId(null);
            setErrorMessage('New match started! Please scan the QR code to join the new match.');
          }
        }
      }
    } catch {
      // Ignore transient network errors in polling fallback
    }
  }, []);

  // Set up polling fallback whenever in room (1s interval for responsive Vercel serverless updates)
  useEffect(() => {
    if (roomId) {
      // Immediate fetch on mount/room change
      fetchRoomStateFallback(roomId);

      pollIntervalRef.current = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          fetchRoomStateFallback(roomId);
        }
      }, 1000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [roomId, fetchRoomStateFallback]);

  // Establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setErrorMessage(null);
        const savedRoomId = sessionStorage.getItem('sl_room_id');
        const savedPlayerId = sessionStorage.getItem('sl_player_id');
        if (savedRoomId && savedPlayerId) {
          ws.send(
            JSON.stringify({
              type: 'RECONNECT',
              payload: { roomId: savedRoomId, playerId: savedPlayerId },
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          handleServerMessage(msg);
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        // Fallback to HTTP polling silently
      };

      ws.onclose = () => {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch {
      // fallback to HTTP polling
    }
  }, [handleServerMessage]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // Unified send action (WebSocket primary, HTTP POST fallback for Vercel serverless)
  const sendWsAction = async (action: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    } else {
      try {
        const res = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });
        if (res.ok) {
          const resp = await res.json();
          if (resp && resp.type) {
            handleServerMessage(resp as ServerMessage);
          }
        }
        // Immediate sync follow-up
        if (roomId) {
          setTimeout(() => fetchRoomStateFallback(roomId), 250);
        }
      } catch {
        setErrorMessage('Failed to send action. Retrying...');
      }
    }
  };

  // User Actions
  const handleCreateRoom = (playerName: string) => {
    sendWsAction({
      type: 'CREATE_ROOM',
      payload: { playerName },
    });
  };

  const handleJoinRoom = (targetRoomId: string, playerName: string) => {
    sendWsAction({
      type: 'JOIN_ROOM',
      payload: { roomId: targetRoomId, playerName },
    });
  };

  const handleStartGame = () => {
    if (!roomId) return;
    sendWsAction({
      type: 'START_GAME',
      payload: { roomId },
    });
  };

  const handleRevealCards = () => {
    if (!roomId) return;
    sendWsAction({
      type: 'REVEAL_CARDS',
      payload: { roomId },
    });
  };

  const handleSelectCard = (cardColor: CardColor) => {
    if (!roomId || !playerId) return;
    sendWsAction({
      type: 'SELECT_CARD',
      payload: { roomId, playerId, cardColor },
    });
  };

  const handleSaveScheme = (cardScheme: RoundCardScheme[]) => {
    if (!roomId) return;
    sendWsAction({
      type: 'UPDATE_CARD_SCHEME',
      payload: { roomId, cardScheme },
    });
  };

  const handleToggleReady = () => {
    if (!roomId || !playerId) return;
    sendWsAction({
      type: 'TOGGLE_READY',
      payload: { roomId, playerId },
    });
  };

  const handleResetGame = () => {
    if (!roomId) return;
    sendWsAction({
      type: 'RESET_GAME',
      payload: { roomId },
    });
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    if (!roomId) return;
    sendWsAction({
      type: 'KICK_PLAYER',
      payload: { roomId, targetPlayerId },
    });
  };

  const handleSubmitEvaluation = (rating: number, feedback: string, evaluatorName?: string) => {
    if (!roomId || !playerId) return;
    sendWsAction({
      type: 'SUBMIT_EVALUATION',
      payload: { roomId, playerId, rating, feedback, evaluatorName },
    });
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('sl_room_id');
    sessionStorage.removeItem('sl_player_id');
    setRoomId(null);
    setPlayerId(null);
    setRoomState(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleToggleMute = () => {
    const newMuted = sounds.toggleMute();
    setIsMuted(newMuted);
  };

  const currentPlayer = (roomState && playerId) ? roomState.players[playerId] : null;
  const isAdmin = currentPlayer?.isAdmin ?? false;
  const isGameOver = roomState?.status === 'finished';
  const totalSchemeRounds = roomState?.cardScheme?.length || 5;

  // Automatically open celebration modal when game finishes
  useEffect(() => {
    if (isGameOver) {
      setIsCelebrationOpen(true);
    } else {
      setIsCelebrationOpen(false);
    }
  }, [isGameOver]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-white flex flex-col overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      {roomState && roomId && (
        <Header
          roomId={roomId}
          roundNumber={roomState.roundNumber}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenQR={() => setIsQROpen(true)}
          onOpenRules={() => setIsRulesOpen(true)}
          onLeaveRoom={handleLeaveRoom}
          isAdmin={isAdmin}
          onResetGame={handleResetGame}
          onOpenSchemeEditor={() => setIsSchemeEditorOpen(true)}
          gameStatus={roomState.status}
        />
      )}

      {/* Floating Alerts */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-rose-600 text-white rounded-xl shadow-xl flex items-center gap-1.5 text-xs font-bold animate-bounce">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Container - strictly constrained to viewport without page scroll */}
      <main className="flex-1 min-h-0 w-full flex flex-col overflow-hidden p-1.5 sm:p-2.5 max-w-7xl mx-auto">
        {!roomState || !roomId || (!isAdmin && !currentPlayer && roomState.status === 'lobby') ? (
          /* 1. Welcome / Join Screen (fits cleanly without scroll) */
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto">
            <WelcomeScreen
              initialRoomCode={initialUrlRoom || (roomState?.roomId ?? '')}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              isLoading={false}
            />
          </div>
        ) : roomState.status === 'lobby' ? (
          /* 2. Lobby View */
          <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-2">
            <Lobby
              roomState={roomState}
              currentPlayerId={playerId}
              isAdmin={isAdmin}
              onStartGame={handleStartGame}
              onToggleReady={handleToggleReady}
              onKickPlayer={handleKickPlayer}
              onOpenSchemeEditor={() => setIsSchemeEditorOpen(true)}
            />
          </div>
        ) : (
          /* 3. Live 50-Square Arena - Unscrollable Screen, Only Leaderboard is scrollable */
          <div className="flex-1 min-h-0 w-full flex flex-col md:flex-row gap-2 overflow-hidden items-stretch">
            {/* Left / Top Section: 50-Square Board + Interactive Color Cards */}
            <div className="flex-shrink-0 md:flex-1 flex flex-col items-center justify-start gap-1.5 max-w-[720px] mx-auto w-full">
              <Board
                players={Object.values(roomState.players)}
                currentPlayerId={playerId}
                activeMovingPlayerId={activeMovingPlayerId}
              />

              {/* Same-Screen Interactive Color Card Selector (35s Timer) */}
              {!isGameOver && currentPlayer && (
                <CardSelector
                  roundNumber={roomState.roundNumber}
                  roundPhase={roomState.roundPhase || 'waiting_for_host'}
                  timerExpiresAt={roomState.timerExpiresAt}
                  cardScheme={roomState.cardScheme}
                  isAdmin={isAdmin}
                  hasSubmitted={currentPlayer.hasSubmittedThisRound}
                  selectedCardColor={currentPlayer.selectedCardColor}
                  pendingRoll={currentPlayer.pendingRoll}
                  lastCardColor={currentPlayer.lastCardColor}
                  disabled={roomState.status === 'animating'}
                  onRevealCards={handleRevealCards}
                  onSelectCard={handleSelectCard}
                />
              )}
            </div>

            {/* Right / Bottom Section: Leaderboard (The ONLY scrollable component) */}
            <div className="flex-1 min-h-0 flex flex-col md:w-80 lg:w-96 overflow-hidden max-w-[720px] md:max-w-none mx-auto w-full">
              <Leaderboard
                players={Object.values(roomState.players)}
                currentPlayerId={playerId}
                isAdmin={isAdmin}
                isGameOver={isGameOver}
                onRestartGame={handleResetGame}
                onOpenCelebrationModal={() => setIsCelebrationOpen(true)}
                totalRounds={totalSchemeRounds}
              />
            </div>
          </div>
        )}
      </main>

      {/* Post-Game Celebration & Performance Statistics Modal */}
      {roomState && (
        <PostGameCelebrationModal
          isOpen={isCelebrationOpen}
          onClose={() => setIsCelebrationOpen(false)}
          players={Object.values(roomState.players)}
          currentPlayerId={playerId}
          isAdmin={isAdmin}
          cardScheme={roomState.cardScheme}
          totalRounds={totalSchemeRounds}
          evaluations={roomState.evaluations || []}
          onSubmitEvaluation={handleSubmitEvaluation}
          onRestartGame={handleResetGame}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* QR Code Quick Modal */}
      {roomId && (
        <QRModal
          isOpen={isQROpen}
          onClose={() => setIsQROpen(false)}
          roomId={roomId}
        />
      )}

      {/* Scheme Editor Modal for Host */}
      <SchemeEditorModal
        isOpen={isSchemeEditorOpen}
        onClose={() => setIsSchemeEditorOpen(false)}
        currentScheme={roomState?.cardScheme}
        onSaveScheme={handleSaveScheme}
      />
    </div>
  );
}
