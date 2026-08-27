import { CardColor, RoundCardScheme } from './utils/cards';

export type { CardColor, RoundCardScheme, CardOption } from './utils/cards';

export interface Snake {
  id: string;
  head: number;
  tail: number;
}

export interface Ladder {
  id: string;
  bottom: number;
  top: number;
}

export interface PlayerRoundChoice {
  round: number;
  cardColor: CardColor | null;
  points: number;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  position: number; // 0 (start) to 50
  previousPosition: number;
  lastRoll: number | null;
  selectedCardColor: CardColor | null;
  lastCardColor: CardColor | null;
  hasSubmittedThisRound: boolean;
  pendingRoll: number | null;
  isReady: boolean;
  isAdmin: boolean;
  connected: boolean;
  rank?: number;
  snakesHitCount: number;
  laddersClimbedCount: number;
  rollsHistory: number[];
  finishedAtRound?: number;
  // Performance & Detailed Match Statistics
  cardChoicesHistory: PlayerRoundChoice[];
  correctAnswersCount: number;
  totalResponseTimeMs: number;
  averageResponseTime: number; // in seconds, e.g. 6.4
  fastestResponseTimeMs: number | null;
  totalPointsEarned: number;
}

export type GameStatus = 'lobby' | 'playing' | 'animating' | 'finished';
export type RoundPhase = 'waiting_for_host' | 'cards_revealed' | 'animating' | 'round_resolved';

export interface MoveStep {
  from: number;
  to: number;
  type: 'roll' | 'ladder' | 'snake';
  description: string;
}

export interface GameLogEntry {
  id: string;
  round: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  playerAvatar: string;
  roll: number;
  cardColor?: CardColor | null;
  from: number;
  intermediate: number;
  to: number;
  specialEvent?: 'ladder' | 'snake' | 'win' | null;
  message: string;
  timestamp: number;
}

export interface GameEvaluation {
  id: string;
  playerId: string;
  evaluatorName: string;
  avatar: string;
  color: string;
  rating: number; // 1 to 5 stars (5 is highest)
  feedback: string; // written feedback for how to make it better
  submittedAt: number;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  status: GameStatus;
  roundPhase: RoundPhase;
  cardsRevealedAt: number | null;
  timerExpiresAt: number | null;
  cardScheme: RoundCardScheme[];
  adminId: string;
  players: Record<string, Player>;
  turnOrder: string[];
  currentTurnIndex: number;
  roundNumber: number;
  winnerId: string | null;
  winners: string[]; // Order of winners (ids)
  logs: GameLogEntry[];
  evaluations?: GameEvaluation[];
  lastActionTimestamp: number;
  activeAnimation?: {
    playerId: string;
    roll: number;
    steps: MoveStep[];
    currentStepIndex: number;
  } | null;
  settings: {
    exact100ToWin: boolean;
    simultaneousRoundRoll: boolean;
  };
}

export type ClientAction =
  | { type: 'CREATE_ROOM'; payload: { playerName: string; avatar?: string; color?: string; cardScheme?: RoundCardScheme[]; settings?: Partial<RoomState['settings']> } }
  | { type: 'JOIN_ROOM'; payload: { roomId: string; playerName: string; avatar?: string; color?: string } }
  | { type: 'RECONNECT'; payload: { roomId: string; playerId: string } }
  | { type: 'START_GAME'; payload: { roomId: string } }
  | { type: 'REVEAL_CARDS'; payload: { roomId: string } }
  | { type: 'SELECT_CARD'; payload: { roomId: string; playerId: string; cardColor: CardColor } }
  | { type: 'SUBMIT_DICE'; payload: { roomId: string; playerId: string; roll: number } }
  | { type: 'UPDATE_CARD_SCHEME'; payload: { roomId: string; cardScheme: RoundCardScheme[] } }
  | { type: 'EXECUTE_ROUND'; payload: { roomId: string } }
  | { type: 'RESET_GAME'; payload: { roomId: string } }
  | { type: 'TOGGLE_READY'; payload: { roomId: string; playerId: string } }
  | { type: 'KICK_PLAYER'; payload: { roomId: string; targetPlayerId: string } }
  | { type: 'SUBMIT_EVALUATION'; payload: { roomId: string; playerId: string; evaluatorName?: string; rating: number; feedback: string } };

export type ServerMessage =
  | { type: 'ROOM_STATE'; payload: RoomState; yourPlayerId?: string }
  | { type: 'JOIN_SUCCESS'; payload: { roomId: string; playerId: string; state: RoomState } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'ANIMATE_MOVE'; payload: { playerId: string; roll: number; cardColor?: CardColor | null; steps: MoveStep[]; finalPosition: number; nextTurnPlayerId?: string } }
  | { type: 'GAME_OVER'; payload: { winnerId: string; rankings: Player[] } };
