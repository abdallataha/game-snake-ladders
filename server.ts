import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { RoomState, Player, ClientAction, MoveStep, GameLogEntry, CardColor, GameStatus, GameEvaluation } from './src/types';
import { SNAKES, LADDERS, BOARD_SIZE, getNextUniqueAvatarAndColor } from './src/utils/board';
import { DEFAULT_CARD_SCHEMES, getPointsForCard, getRoundCardScheme } from './src/utils/cards';

interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
  roomId?: string;
  playerId?: string;
}

const rooms = new Map<string, RoomState>();
const clientSockets = new Map<string, ExtWebSocket>(); // key: `${roomId}:${playerId}`
const roomTimers = new Map<string, NodeJS.Timeout>(); // active 35s card timers per room

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function broadcastToRoom(roomId: string, message: object) {
  const payload = JSON.stringify(message);
  for (const [key, ws] of clientSockets.entries()) {
    if (key.startsWith(`${roomId}:`) && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Calculate move logic for 50 squares and 0-20 points roll
function calculateMove(from: number, roll: number, exact50: boolean): {
  intermediate: number;
  final: number;
  steps: MoveStep[];
  specialEvent?: 'ladder' | 'snake' | 'win' | null;
} {
  const steps: MoveStep[] = [];

  // Special case: 0 points entered (stay in place)
  if (roll === 0) {
    steps.push({
      from,
      to: from,
      type: 'roll',
      description: `0 PTS, held position at square ${from}`,
    });
    return { intermediate: from, final: from, steps, specialEvent: null };
  }

  let intermediate = from + roll;

  if (exact50) {
    if (intermediate > BOARD_SIZE) {
      // Bounce back rule: overshoot bounces back from 50
      const overshoot = intermediate - BOARD_SIZE;
      intermediate = BOARD_SIZE - overshoot;
      steps.push({
        from,
        to: intermediate,
        type: 'roll',
        description: `+${roll} PTS, overshot 50, bounced back to square ${intermediate}`,
      });
    } else {
      steps.push({
        from,
        to: intermediate,
        type: 'roll',
        description: `+${roll} PTS, advanced to square ${intermediate}`,
      });
    }
  } else {
    intermediate = Math.min(BOARD_SIZE, intermediate);
    steps.push({
      from,
      to: intermediate,
      type: 'roll',
      description: `+${roll} PTS, advanced to square ${intermediate}`,
    });
  }

  let final = intermediate;
  let specialEvent: 'ladder' | 'snake' | 'win' | null = null;

  // Check ladders (5 total)
  const ladder = LADDERS.find((l) => l.bottom === intermediate);
  if (ladder) {
    final = ladder.top;
    specialEvent = 'ladder';
    steps.push({
      from: intermediate,
      to: final,
      type: 'ladder',
      description: `🪜 Climbed ladder from ${ladder.bottom} up to ${ladder.top}!`,
    });
  }

  // Check snakes (7 total)
  const snake = SNAKES.find((s) => s.head === intermediate);
  if (snake) {
    final = snake.tail;
    specialEvent = 'snake';
    steps.push({
      from: intermediate,
      to: final,
      type: 'snake',
      description: `🐍 Bitten by snake at ${snake.head}! Slid down to ${snake.tail}!`,
    });
  }

  if (final === BOARD_SIZE) {
    specialEvent = 'win';
  }

  return { intermediate, final, steps, specialEvent };
}

async function processRoundMoves(room: RoomState) {
  // Clear any existing timer for this room
  if (roomTimers.has(room.roomId)) {
    clearTimeout(roomTimers.get(room.roomId)!);
    roomTimers.delete(room.roomId);
  }

  room.status = 'animating';
  room.roundPhase = 'animating';
  broadcastToRoom(room.roomId, { type: 'ROOM_STATE', payload: room });

  const playersToMove = Object.values(room.players).filter(
    (p) => p.position < BOARD_SIZE && p.pendingRoll !== null
  );

  for (const player of playersToMove) {
    const roll = player.pendingRoll ?? 0;
    const chosenColor = player.selectedCardColor;
    const move = calculateMove(player.position, roll, room.settings.exact100ToWin);

    player.previousPosition = player.position;
    player.position = move.final;
    player.lastRoll = roll;
    player.lastCardColor = chosenColor;
    player.rollsHistory.push(roll);
    player.pendingRoll = null;

    if (move.specialEvent === 'ladder') player.laddersClimbedCount++;
    if (move.specialEvent === 'snake') player.snakesHitCount++;

    let logMessage = '';
    if (chosenColor) {
      logMessage = `${player.name} picked ${chosenColor} CARD (+${roll} PTS) [${player.previousPosition} → ${move.intermediate}]`;
    } else {
      logMessage = `${player.name} timed out without choosing (0 PTS, held square ${player.position})`;
    }

    if (move.specialEvent === 'ladder') {
      logMessage += ` and climbed a LADDER to ${move.final}! 🪜`;
    } else if (move.specialEvent === 'snake') {
      logMessage += ` and got bitten by a SNAKE down to ${move.final}! 🐍`;
    }

    if (player.position === BOARD_SIZE && !room.winners.includes(player.id)) {
      room.winners.push(player.id);
      player.finishedAtRound = room.roundNumber;
      player.rank = room.winners.length;
      if (!room.winnerId) {
        room.winnerId = player.id;
      }
      logMessage += ` 🏆 REACHED SQUARE ${BOARD_SIZE}! (Rank #${player.rank})`;
    }

    const logEntry: GameLogEntry = {
      id: 'log_' + Date.now() + Math.random(),
      round: room.roundNumber,
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      playerAvatar: player.avatar,
      roll,
      cardColor: chosenColor,
      from: player.previousPosition,
      intermediate: move.intermediate,
      to: move.final,
      specialEvent: move.specialEvent,
      message: logMessage,
      timestamp: Date.now(),
    };
    room.logs.unshift(logEntry);

    broadcastToRoom(room.roomId, {
      type: 'ANIMATE_MOVE',
      payload: {
        playerId: player.id,
        roll,
        cardColor: chosenColor,
        steps: move.steps,
        finalPosition: move.final,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  // Reset player round flags
  Object.values(room.players).forEach((p) => {
    p.hasSubmittedThisRound = false;
    p.selectedCardColor = null;
    p.pendingRoll = null;
  });

  room.roundNumber++;
  room.roundPhase = 'waiting_for_host';
  room.cardsRevealedAt = null;
  room.timerExpiresAt = null;

  checkGameOver(room);
  if ((room.status as GameStatus) !== 'finished') {
    room.status = 'playing';
  }

  broadcastToRoom(room.roomId, { type: 'ROOM_STATE', payload: room });
}

function checkGameOver(room: RoomState) {
  const totalRoundsInScheme = room.cardScheme && room.cardScheme.length > 0 ? room.cardScheme.length : 5;
  const allSchemeRoundsCompleted = room.roundNumber > totalRoundsInScheme;
  const unfinished = Object.values(room.players).filter((p) => p.position < BOARD_SIZE);

  if (allSchemeRoundsCompleted || (room.winners.length > 0 && unfinished.length === 0)) {
    room.status = 'finished';
    assignRemainingRanks(room);
  }
}

function assignRemainingRanks(room: RoomState) {
  const allPlayers = Object.values(room.players);
  allPlayers.sort((a, b) => {
    // 1. Reached square 50 first (already assigned winner rank)
    if (a.rank && b.rank && room.winners.includes(a.id) && room.winners.includes(b.id)) {
      return a.rank - b.rank;
    }
    if (room.winners.includes(a.id)) return -1;
    if (room.winners.includes(b.id)) return 1;

    // 2. Highest position on board (e.g. 48 vs 42)
    if (b.position !== a.position) {
      return b.position - a.position;
    }
    // 3. Highest correct answers count
    if (b.correctAnswersCount !== a.correctAnswersCount) {
      return b.correctAnswersCount - a.correctAnswersCount;
    }
    // 4. Highest total points earned
    if (b.totalPointsEarned !== a.totalPointsEarned) {
      return b.totalPointsEarned - a.totalPointsEarned;
    }
    // 5. Fastest average response time (lower is faster)
    if (a.averageResponseTime && b.averageResponseTime && a.averageResponseTime !== b.averageResponseTime) {
      return a.averageResponseTime - b.averageResponseTime;
    }
    // 6. Fewer snakes hit
    return a.snakesHitCount - b.snakesHitCount;
  });

  allPlayers.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  if (!room.winnerId && allPlayers.length > 0) {
    room.winnerId = allPlayers[0].id;
    if (!room.winners.includes(allPlayers[0].id)) {
      room.winners.push(allPlayers[0].id);
    }
  }
}

function executeAction(
  action: ClientAction,
  respondDirect: (msg: object) => void,
  bindSocket?: (roomId: string, playerId: string) => void
) {
  switch (action.type) {
    case 'CREATE_ROOM': {
      const { playerName, cardScheme, settings } = action.payload;
      let roomId = generateRoomId();
      while (rooms.has(roomId)) {
        roomId = generateRoomId();
      }

      const { avatar: initialAvatar, color: initialColor } = getNextUniqueAvatarAndColor({});
      const adminPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
      const adminPlayer: Player = {
        id: adminPlayerId,
        name: playerName.trim() || 'Admin Host',
        avatar: initialAvatar,
        color: initialColor,
        position: 0,
        previousPosition: 0,
        lastRoll: null,
        selectedCardColor: null,
        lastCardColor: null,
        hasSubmittedThisRound: false,
        pendingRoll: null,
        isReady: true,
        isAdmin: true,
        connected: true,
        snakesHitCount: 0,
        laddersClimbedCount: 0,
        rollsHistory: [],
        cardChoicesHistory: [],
        correctAnswersCount: 0,
        totalResponseTimeMs: 0,
        averageResponseTime: 0,
        fastestResponseTimeMs: null,
        totalPointsEarned: 0,
      };

      const newRoom: RoomState = {
        roomId,
        roomName: `${adminPlayer.name}'s Match`,
        status: 'lobby',
        roundPhase: 'waiting_for_host',
        cardsRevealedAt: null,
        timerExpiresAt: null,
        cardScheme: cardScheme && cardScheme.length > 0 ? cardScheme : JSON.parse(JSON.stringify(DEFAULT_CARD_SCHEMES)),
        adminId: adminPlayerId,
        players: { [adminPlayerId]: adminPlayer },
        turnOrder: [adminPlayerId],
        currentTurnIndex: 0,
        roundNumber: 1,
        winnerId: null,
        winners: [],
        logs: [
          {
            id: 'log_' + Date.now(),
            round: 0,
            playerId: adminPlayerId,
            playerName: adminPlayer.name,
            playerColor: adminPlayer.color,
            playerAvatar: adminPlayer.avatar,
            roll: 0,
            from: 0,
            intermediate: 0,
            to: 0,
            message: `${adminPlayer.name} created the match (50 Squares, 5 Ladders, 7 Snakes)! Scan QR to join.`,
            timestamp: Date.now(),
          },
        ],
        lastActionTimestamp: Date.now(),
        settings: {
          exact100ToWin: settings?.exact100ToWin ?? true,
          simultaneousRoundRoll: settings?.simultaneousRoundRoll ?? true,
        },
      };

      rooms.set(roomId, newRoom);
      if (bindSocket) bindSocket(roomId, adminPlayerId);

      respondDirect({
        type: 'JOIN_SUCCESS',
        payload: { roomId, playerId: adminPlayerId, state: newRoom },
      });
      break;
    }

    case 'JOIN_ROOM': {
      const { roomId: rawRoomId, playerName } = action.payload;
      const roomId = rawRoomId.toUpperCase().trim();
      const room = rooms.get(roomId);

      if (!room) {
        return respondDirect({ type: 'ERROR', payload: { message: `Room "${roomId}" does not exist.` } });
      }

      const { avatar: uniqueAvatar, color: uniqueColor } = getNextUniqueAvatarAndColor(room.players);
      const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
      const newPlayer: Player = {
        id: playerId,
        name: playerName.trim() || `Player ${Object.keys(room.players).length + 1}`,
        avatar: uniqueAvatar,
        color: uniqueColor,
        position: 0,
        previousPosition: 0,
        lastRoll: null,
        selectedCardColor: null,
        lastCardColor: null,
        hasSubmittedThisRound: false,
        pendingRoll: null,
        isReady: room.status === 'playing',
        isAdmin: false,
        connected: true,
        snakesHitCount: 0,
        laddersClimbedCount: 0,
        rollsHistory: [],
        cardChoicesHistory: [],
        correctAnswersCount: 0,
        totalResponseTimeMs: 0,
        averageResponseTime: 0,
        fastestResponseTimeMs: null,
        totalPointsEarned: 0,
      };

      room.players[playerId] = newPlayer;
      if (!room.turnOrder.includes(playerId)) {
        room.turnOrder.push(playerId);
      }

      room.logs.push({
        id: 'log_' + Date.now() + Math.random(),
        round: room.roundNumber,
        playerId,
        playerName: newPlayer.name,
        playerColor: newPlayer.color,
        playerAvatar: newPlayer.avatar,
        roll: 0,
        from: 0,
        intermediate: 0,
        to: 0,
        message: `${newPlayer.name} scanned the QR code and joined the match!`,
        timestamp: Date.now(),
      });

      if (bindSocket) bindSocket(roomId, playerId);

      respondDirect({
        type: 'JOIN_SUCCESS',
        payload: { roomId, playerId, state: room },
      });

      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      break;
    }

    case 'RECONNECT': {
      const { roomId: rawRoomId, playerId } = action.payload;
      const roomId = rawRoomId.toUpperCase().trim();
      const room = rooms.get(roomId);

      if (!room || !room.players[playerId]) {
        return respondDirect({ type: 'ERROR', payload: { message: 'Session expired or new match started. Please scan QR code to join.' } });
      }

      room.players[playerId].connected = true;
      if (bindSocket) bindSocket(roomId, playerId);

      respondDirect({
        type: 'JOIN_SUCCESS',
        payload: { roomId, playerId, state: room },
      });

      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      break;
    }

    case 'START_GAME': {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;

      // Clear any prior timer
      if (roomTimers.has(roomId)) {
        clearTimeout(roomTimers.get(roomId)!);
        roomTimers.delete(roomId);
      }

      room.status = 'playing';
      room.roundPhase = 'waiting_for_host';
      room.cardsRevealedAt = null;
      room.timerExpiresAt = null;
      room.roundNumber = 1;
      room.currentTurnIndex = 0;
      room.winnerId = null;
      room.winners = [];

      Object.values(room.players).forEach((p) => {
        p.position = 0;
        p.previousPosition = 0;
        p.lastRoll = null;
        p.selectedCardColor = null;
        p.lastCardColor = null;
        p.hasSubmittedThisRound = false;
        p.pendingRoll = null;
        p.snakesHitCount = 0;
        p.laddersClimbedCount = 0;
        p.rollsHistory = [];
        p.cardChoicesHistory = [];
        p.correctAnswersCount = 0;
        p.totalResponseTimeMs = 0;
        p.averageResponseTime = 0;
        p.fastestResponseTimeMs = null;
        p.totalPointsEarned = 0;
        delete p.finishedAtRound;
        delete p.rank;
      });

      room.logs.push({
        id: 'log_' + Date.now(),
        round: 1,
        playerId: room.adminId,
        playerName: 'Game Master',
        playerColor: '#10b981',
        playerAvatar: '🏁',
        roll: 0,
        from: 0,
        intermediate: 0,
        to: 0,
        message: `Match started with ${Object.keys(room.players).length} players! Host reveals cards each round (35s timer).`,
        timestamp: Date.now(),
      });

      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      respondDirect({ type: 'ROOM_STATE', payload: room });
      break;
    }

    case 'REVEAL_CARDS': {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      // Only host can trigger
      if (room.roundPhase === 'cards_revealed') return;

      room.roundPhase = 'cards_revealed';
      const now = Date.now();
      room.cardsRevealedAt = now;
      room.timerExpiresAt = now + 30000; // 30 seconds

      // Reset submission state for this round
      Object.values(room.players).forEach((p) => {
        if (p.position < BOARD_SIZE) {
          p.hasSubmittedThisRound = false;
          p.selectedCardColor = null;
          p.pendingRoll = null;
        }
      });

      room.logs.push({
        id: 'log_' + Date.now(),
        round: room.roundNumber,
        playerId: room.adminId,
        playerName: 'Host',
        playerColor: '#6366f1',
        playerAvatar: '🎴',
        roll: 0,
        from: 0,
        intermediate: 0,
        to: 0,
        message: `Round ${room.roundNumber} cards revealed! Players have 30 seconds to select RED, BLUE, GREEN, or YELLOW.`,
        timestamp: Date.now(),
      });

      // Clear any prior timer
      if (roomTimers.has(roomId)) {
        clearTimeout(roomTimers.get(roomId)!);
      }

      // 30-Second Countdown Timer on Server
      const timer = setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (currentRoom && currentRoom.status === 'playing' && currentRoom.roundPhase === 'cards_revealed') {
          // If any player didn't choose a card within 30s, their score is 0 and avatar won't move
          Object.values(currentRoom.players).forEach((p) => {
            if (p.position < BOARD_SIZE && !p.hasSubmittedThisRound) {
              p.hasSubmittedThisRound = true;
              p.selectedCardColor = null;
              p.pendingRoll = 0;
              p.cardChoicesHistory.push({
                round: currentRoom.roundNumber,
                cardColor: null,
                points: 0,
                isCorrect: false,
                responseTimeMs: 30000,
              });
              p.totalResponseTimeMs += 30000;
              p.averageResponseTime = Number((p.totalResponseTimeMs / (p.cardChoicesHistory.length * 1000)).toFixed(1));
            }
          });
          processRoundMoves(currentRoom);
        }
      }, 30000);
      roomTimers.set(roomId, timer);

      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      respondDirect({ type: 'ROOM_STATE', payload: room });
      break;
    }

    case 'SELECT_CARD': {
      const { roomId, playerId, cardColor } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing' || room.roundPhase !== 'cards_revealed') return;

      const player = room.players[playerId];
      if (!player) return;
      if (player.position === BOARD_SIZE) return;

      const now = Date.now();
      const responseTimeMs = room.cardsRevealedAt ? Math.max(150, now - room.cardsRevealedAt) : 5000;
      const scheme = getRoundCardScheme(room.cardScheme, room.roundNumber);
      const points = getPointsForCard(room.cardScheme, room.roundNumber, cardColor);
      const isCorrect = scheme.correctColor ? scheme.correctColor === cardColor : (points > 0);

      player.selectedCardColor = cardColor;
      player.pendingRoll = points;
      player.hasSubmittedThisRound = true;

      // Update player statistics
      player.cardChoicesHistory.push({
        round: room.roundNumber,
        cardColor,
        points,
        isCorrect,
        responseTimeMs,
      });
      if (isCorrect) player.correctAnswersCount++;
      player.totalResponseTimeMs += responseTimeMs;
      player.averageResponseTime = Number((player.totalResponseTimeMs / (player.cardChoicesHistory.length * 1000)).toFixed(1));
      if (player.fastestResponseTimeMs === null || responseTimeMs < player.fastestResponseTimeMs) {
        player.fastestResponseTimeMs = responseTimeMs;
      }
      player.totalPointsEarned += points;

      // Check if all active unfinished players have selected their cards
      const unfinishedPlayers = Object.values(room.players).filter(
        (p) => p.position < BOARD_SIZE && p.connected
      );
      const allSubmitted = unfinishedPlayers.length > 0 && unfinishedPlayers.every((p) => p.hasSubmittedThisRound);

      if (allSubmitted) {
        if (roomTimers.has(roomId)) {
          clearTimeout(roomTimers.get(roomId)!);
          roomTimers.delete(roomId);
        }
        processRoundMoves(room);
      } else {
        broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
        respondDirect({ type: 'ROOM_STATE', payload: room });
      }
      break;
    }

    case 'UPDATE_CARD_SCHEME': {
      const { roomId, cardScheme } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;

      room.cardScheme = cardScheme;
      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      respondDirect({ type: 'ROOM_STATE', payload: room });
      break;
    }

    case 'SUBMIT_DICE': {
      // Backwards compatibility for numeric dice if triggered
      const { roomId, playerId, roll } = action.payload;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      const player = room.players[playerId];
      if (!player || player.position === BOARD_SIZE) return;

      const validRoll = Math.max(0, Math.min(20, Math.floor(Number(roll) || 0)));
      player.pendingRoll = validRoll;
      player.hasSubmittedThisRound = true;

      const unfinishedPlayers = Object.values(room.players).filter((p) => p.position < BOARD_SIZE && p.connected);
      const allSubmitted = unfinishedPlayers.length > 0 && unfinishedPlayers.every((p) => p.hasSubmittedThisRound);

      if (allSubmitted) {
        processRoundMoves(room);
      } else {
        broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
        respondDirect({ type: 'ROOM_STATE', payload: room });
      }
      break;
    }

    case 'RESET_GAME': {
      const { roomId } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;

      if (roomTimers.has(roomId)) {
        clearTimeout(roomTimers.get(roomId)!);
        roomTimers.delete(roomId);
      }

      // Reset room status to lobby and clear all previous players except the admin host
      const adminPlayer = room.players[room.adminId];
      if (adminPlayer) {
        adminPlayer.position = 0;
        adminPlayer.previousPosition = 0;
        adminPlayer.lastRoll = null;
        adminPlayer.selectedCardColor = null;
        adminPlayer.lastCardColor = null;
        adminPlayer.hasSubmittedThisRound = false;
        adminPlayer.pendingRoll = null;
        adminPlayer.snakesHitCount = 0;
        adminPlayer.laddersClimbedCount = 0;
        adminPlayer.rollsHistory = [];
        adminPlayer.cardChoicesHistory = [];
        adminPlayer.correctAnswersCount = 0;
        adminPlayer.totalResponseTimeMs = 0;
        adminPlayer.averageResponseTime = 0;
        adminPlayer.fastestResponseTimeMs = null;
        adminPlayer.totalPointsEarned = 0;
        delete adminPlayer.finishedAtRound;
        delete adminPlayer.rank;

        room.players = { [room.adminId]: adminPlayer };
        room.turnOrder = [room.adminId];
      }

      room.status = 'lobby';
      room.roundPhase = 'waiting_for_host';
      room.cardsRevealedAt = null;
      room.timerExpiresAt = null;
      room.roundNumber = 1;
      room.currentTurnIndex = 0;
      room.winnerId = null;
      room.winners = [];

      room.logs = [
        {
          id: 'log_' + Date.now(),
          round: 0,
          playerId: room.adminId,
          playerName: adminPlayer?.name || 'Host',
          playerColor: adminPlayer?.color || '#ef4444',
          playerAvatar: adminPlayer?.avatar || '🦁',
          roll: 0,
          from: 0,
          intermediate: 0,
          to: 0,
          message: 'New match started! All previous players removed. Scan QR code to enter.',
          timestamp: Date.now(),
        },
      ];

      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      respondDirect({ type: 'ROOM_STATE', payload: room });
      break;
    }

    case 'TOGGLE_READY': {
      const { roomId, playerId } = action.payload;
      const room = rooms.get(roomId);
      if (!room || !room.players[playerId]) return;

      room.players[playerId].isReady = !room.players[playerId].isReady;
      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      break;
    }

    case 'KICK_PLAYER': {
      const { roomId, targetPlayerId } = action.payload;
      const room = rooms.get(roomId);
      if (!room || !room.players[targetPlayerId] || targetPlayerId === room.adminId) return;

      delete room.players[targetPlayerId];
      room.turnOrder = room.turnOrder.filter((id) => id !== targetPlayerId);

      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      break;
    }

    case 'SUBMIT_EVALUATION': {
      const { roomId, playerId, evaluatorName, rating, feedback } = action.payload;
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players[playerId];
      const name = (evaluatorName && evaluatorName.trim()) || player?.name || 'Evaluator';
      const cleanRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
      const cleanFeedback = String(feedback || '').trim();

      if (!room.evaluations) {
        room.evaluations = [];
      }

      const existingIndex = room.evaluations.findIndex((e) => e.playerId === playerId);
      const evalItem: GameEvaluation = {
        id: `eval_${playerId}_${Date.now()}`,
        playerId,
        evaluatorName: name,
        avatar: player?.avatar || '⭐',
        color: player?.color || '#6366f1',
        rating: cleanRating,
        feedback: cleanFeedback,
        submittedAt: Date.now(),
      };

      if (existingIndex >= 0) {
        room.evaluations[existingIndex] = evalItem;
      } else {
        room.evaluations.push(evalItem);
      }

      broadcastToRoom(roomId, { type: 'ROOM_STATE', payload: room });
      respondDirect({ type: 'ROOM_STATE', payload: room });
      break;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API HTTP fallback endpoints
  app.get('/api/room/:roomId', (req, res) => {
    const roomId = req.params.roomId.toUpperCase().trim();
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ state: room });
  });

  app.post('/api/action', (req, res) => {
    const action = req.body as ClientAction;
    if (!action || !action.type) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    let responseMsg: object | null = null;
    executeAction(action, (msg) => {
      responseMsg = msg;
    });

    res.json(responseMsg || { status: 'ok' });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: ExtWebSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const action: ClientAction = JSON.parse(raw.toString());
        executeAction(
          action,
          (response) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(response));
            }
          },
          (roomId, playerId) => {
            ws.roomId = roomId;
            ws.playerId = playerId;
            clientSockets.set(`${roomId}:${playerId}`, ws);
          }
        );
      } catch (err) {
        console.error('Error handling ws action:', err);
      }
    });

    ws.on('close', () => {
      if (ws.roomId && ws.playerId) {
        const key = `${ws.roomId}:${ws.playerId}`;
        clientSockets.delete(key);
        const room = rooms.get(ws.roomId);
        if (room && room.players[ws.playerId]) {
          room.players[ws.playerId].connected = false;
          broadcastToRoom(ws.roomId, { type: 'ROOM_STATE', payload: room });
        }
      }
    });
  });

  // Heartbeat ping interval
  const interval = setInterval(() => {
    wss.clients.forEach((wsClient) => {
      const extWs = wsClient as ExtWebSocket;
      if (extWs.isAlive === false) return extWs.terminate();
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Snakes & Ladders Server running on http://localhost:${PORT}`);
  });
}

startServer();
