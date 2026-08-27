import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  Medal,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  BarChart3,
  X,
  Eye,
  Star,
  MessageSquare,
  Send,
  User,
  Check,
} from 'lucide-react';
import { Player, RoundCardScheme, CardColor, GameEvaluation } from '../types';
import { BOARD_SIZE } from '../utils/board';
import { sounds } from '../utils/audio';

interface PostGameCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  currentPlayerId: string | null;
  isAdmin: boolean;
  cardScheme: RoundCardScheme[];
  totalRounds: number;
  evaluations?: GameEvaluation[];
  onSubmitEvaluation?: (rating: number, feedback: string, evaluatorName?: string) => void;
  onRestartGame: () => void;
}

export const PostGameCelebrationModal: React.FC<PostGameCelebrationModalProps> = ({
  isOpen,
  onClose,
  players,
  currentPlayerId,
  isAdmin,
  cardScheme,
  totalRounds,
  evaluations = [],
  onSubmitEvaluation,
  onRestartGame,
}) => {
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'podium' | 'matrix' | 'evaluation'>('podium');

  // Evaluation Form State
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const myExistingEval = evaluations.find((e) => e.playerId === currentPlayerId);

  const [rating, setRating] = useState<number>(myExistingEval ? myExistingEval.rating : 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [evaluatorName, setEvaluatorName] = useState<string>(myExistingEval?.evaluatorName || currentPlayer?.name || '');
  const [feedback, setFeedback] = useState<string>(myExistingEval?.feedback || '');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<boolean>(false);

  useEffect(() => {
    if (myExistingEval) {
      setRating(myExistingEval.rating);
      setEvaluatorName(myExistingEval.evaluatorName);
      setFeedback(myExistingEval.feedback);
    } else if (currentPlayer) {
      setEvaluatorName(currentPlayer.name);
    }
  }, [myExistingEval, currentPlayer]);

  const handleSubmitEval = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onSubmitEvaluation) return;
    sounds.playClick();
    const finalName = evaluatorName.trim() || currentPlayer?.name || 'Evaluator';
    onSubmitEvaluation(rating, feedback, finalName);
    setSubmitSuccessMsg(true);
    setTimeout(() => {
      setSubmitSuccessMsg(false);
    }, 3000);
  };

  // Sort players by rank ascending
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    if (b.position !== a.position) return b.position - a.position;
    return (b.correctAnswersCount || 0) - (a.correctAnswersCount || 0);
  });

  const winner = sortedPlayers[0];
  const second = sortedPlayers.length > 1 ? sortedPlayers[1] : null;
  const third = sortedPlayers.length > 2 ? sortedPlayers[2] : null;

  // Trigger celebration confetti
  useEffect(() => {
    if (isOpen) {
      sounds.playVictory();
      
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 40 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: 0.2, y: 0.4 } });
        confetti({ ...defaults, particleCount, origin: { x: 0.8, y: 0.4 } });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute accolades
  const fastestPlayer = [...players]
    .filter((p) => (p.cardChoicesHistory?.length || 0) > 0 && p.averageResponseTime > 0)
    .sort((a, b) => a.averageResponseTime - b.averageResponseTime)[0];

  const mostAccuratePlayer = [...players]
    .filter((p) => (p.correctAnswersCount || 0) > 0)
    .sort((a, b) => (b.correctAnswersCount || 0) - (a.correctAnswersCount || 0))[0];

  const mostLaddersPlayer = [...players]
    .filter((p) => p.laddersClimbedCount > 0)
    .sort((a, b) => b.laddersClimbedCount - a.laddersClimbedCount)[0];

  const cardBadgeColor: Record<CardColor, string> = {
    RED: 'bg-red-500/20 text-red-300 border-red-500/40',
    BLUE: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    GREEN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    YELLOW: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  };

  // Evaluation statistics
  const totalEvaluations = evaluations.length;
  const averageRating = totalEvaluations > 0
    ? (evaluations.reduce((sum, e) => sum + e.rating, 0) / totalEvaluations).toFixed(1)
    : '5.0';

  const ratingDescriptions: Record<number, string> = {
    1: '1 Star — Poor / Needs Major Improvement',
    2: '2 Stars — Fair / Needs Work',
    3: '3 Stars — Good / Average Experience',
    4: '4 Stars — Very Good / Enjoyable Match',
    5: '5 Stars — Excellent / Outstanding (Highest)',
  };

  return (
    <div
      id="post-game-celebration-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Winner Announcement */}
        <div className="relative px-4 py-3 bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950/60 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/10">
              <Crown className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                  <span>MATCH FINISHED</span>
                  <span className="text-amber-400">🏆</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/30">
                  {totalRounds} Rounds Completed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {winner ? (
                  <>
                    Champion:{' '}
                    <span className="text-amber-300 font-bold">{winner.name}</span> reached{' '}
                    <span className="text-white font-mono font-bold">Square {winner.position}/{BOARD_SIZE}</span>
                  </>
                ) : (
                  'Game completed across all scheme rounds'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="view-board-btn"
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[11px] flex items-center gap-1 border border-slate-700 transition-all"
              title="Inspect the 50-square board"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Board</span>
            </button>
            <button
              id="close-celebration-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-950/70 border-b border-slate-800 gap-1 sm:gap-2 flex-shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              id="tab-podium-btn"
              type="button"
              onClick={() => setActiveTab('podium')}
              className={`px-2.5 sm:px-3 py-1 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                activeTab === 'podium'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Podium & Stats</span>
            </button>

            <button
              id="tab-matrix-btn"
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-2.5 sm:px-3 py-1 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rounds Breakdown</span>
            </button>

            {/* Evaluation & Feedback Tab */}
            <button
              id="tab-evaluation-btn"
              type="button"
              onClick={() => setActiveTab('evaluation')}
              className={`px-2.5 sm:px-3 py-1 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                activeTab === 'evaluation'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-400/25 ring-1 ring-amber-300 font-black'
                  : 'bg-slate-900 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeTab === 'evaluation' ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-400'}`} />
              <span>Evaluation (1-5★)</span>
              {evaluations.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                    activeTab === 'evaluation'
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  }`}
                >
                  {evaluations.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400 flex-shrink-0">
            <span>{players.length} Contenders</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {activeTab === 'podium' && (
            <>
              {/* 1. Winner Podium (Top 3) */}
              <div className="p-3 bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-slate-800/80 shadow-inner">
                <div className="flex items-end justify-center gap-2 sm:gap-4 pt-4 pb-2">
                  {/* 2nd Place */}
                  {second && (
                    <div className="flex flex-col items-center flex-1 max-w-[150px]">
                      <div className="relative mb-1">
                        <div
                          className="w-11 h-11 rounded-2xl border-2 border-slate-300 flex items-center justify-center text-xl shadow-md"
                          style={{ backgroundColor: second.color }}
                        >
                          {second.avatar}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-950 text-[10px] font-black flex items-center justify-center shadow">
                          2
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-200 truncate w-full text-center">
                        {second.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Sq {second.position} • {second.correctAnswersCount || 0}✓
                      </span>
                      <div className="w-full h-14 bg-gradient-to-t from-slate-800 to-slate-700 rounded-t-xl mt-2 flex flex-col items-center justify-center border-t border-slate-600 shadow">
                        <Medal className="w-4 h-4 text-slate-300" />
                        <span className="text-[9px] font-mono font-bold text-slate-300 mt-0.5">2ND PLACE</span>
                      </div>
                    </div>
                  )}

                  {/* 1st Place Champion */}
                  {winner && (
                    <div className="flex flex-col items-center flex-1 max-w-[170px] -mt-4">
                      <div className="relative mb-1">
                        <Crown className="w-6 h-6 text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                        <div
                          className="w-14 h-14 rounded-2xl border-2 border-amber-400 flex items-center justify-center text-2xl shadow-xl shadow-amber-400/25 ring-2 ring-amber-400/50"
                          style={{ backgroundColor: winner.color }}
                        >
                          {winner.avatar}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center shadow-lg">
                          1
                        </span>
                      </div>
                      <span className="text-sm font-black text-amber-300 truncate w-full text-center flex items-center justify-center gap-1">
                        {winner.name}
                        {winner.id === currentPlayerId && (
                          <span className="text-[8px] bg-amber-400 text-slate-950 px-1 rounded font-mono">YOU</span>
                        )}
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        Square {winner.position} • {winner.correctAnswersCount || 0} Correct
                      </span>
                      <div className="w-full h-20 bg-gradient-to-t from-amber-600/40 via-amber-500/30 to-amber-400/20 rounded-t-2xl mt-2 flex flex-col items-center justify-center border-t-2 border-amber-400 shadow-xl shadow-amber-500/10">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span className="text-[10px] font-mono font-black text-amber-300 mt-0.5">CHAMPION</span>
                        <span className="text-[9px] font-mono text-amber-200/80">
                          {winner.averageResponseTime > 0 ? `Avg ${winner.averageResponseTime}s` : 'Top Reach'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {third && (
                    <div className="flex flex-col items-center flex-1 max-w-[150px]">
                      <div className="relative mb-1">
                        <div
                          className="w-11 h-11 rounded-2xl border-2 border-amber-700 flex items-center justify-center text-xl shadow-md"
                          style={{ backgroundColor: third.color }}
                        >
                          {third.avatar}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-black flex items-center justify-center shadow">
                          3
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-200 truncate w-full text-center">
                        {third.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Sq {third.position} • {third.correctAnswersCount || 0}✓
                      </span>
                      <div className="w-full h-10 bg-gradient-to-t from-amber-950 to-amber-900/60 rounded-t-xl mt-2 flex flex-col items-center justify-center border-t border-amber-800 shadow">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span className="text-[9px] font-mono font-bold text-amber-500 mt-0.5">3RD PLACE</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Match Accolades Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {fastestPlayer && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-amber-400 text-[10px] font-mono font-bold uppercase">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Speed Demon</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-white/40"
                        style={{ backgroundColor: fastestPlayer.color }}
                      >
                        {fastestPlayer.avatar}
                      </div>
                      <span className="text-xs font-bold text-slate-200 truncate">{fastestPlayer.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-black text-amber-300">
                      ⚡ {fastestPlayer.averageResponseTime}s avg
                    </span>
                  </div>
                )}

                {mostAccuratePlayer && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Top Accuracy</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-white/40"
                        style={{ backgroundColor: mostAccuratePlayer.color }}
                      >
                        {mostAccuratePlayer.avatar}
                      </div>
                      <span className="text-xs font-bold text-slate-200 truncate">{mostAccuratePlayer.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-black text-emerald-400">
                      🎯 {mostAccuratePlayer.correctAnswersCount} / {totalRounds} Correct
                    </span>
                  </div>
                )}

                {mostLaddersPlayer && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-sky-400 text-[10px] font-mono font-bold uppercase">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ladder Climber</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-white/40"
                        style={{ backgroundColor: mostLaddersPlayer.color }}
                      >
                        {mostLaddersPlayer.avatar}
                      </div>
                      <span className="text-xs font-bold text-slate-200 truncate">{mostLaddersPlayer.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-black text-sky-300">
                      🪜 {mostLaddersPlayer.laddersClimbedCount} Climbed
                    </span>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-indigo-400 text-[10px] font-mono font-bold uppercase">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Total Rounds</span>
                  </div>
                  <span className="text-sm font-black font-mono text-white mt-1">
                    {totalRounds} Completed
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Scheme Questions
                  </span>
                </div>
              </div>

              {/* 3. Comprehensive Player Statistics Table */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Detailed Player Analytics
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Right answers vs Speed vs Board Reach
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {sortedPlayers.map((player, idx) => {
                    const isYou = player.id === currentPlayerId;
                    const rank = player.rank || idx + 1;
                    const isSelected = selectedPlayerForDetail === player.id;
                    const accuracy = totalRounds > 0 
                      ? Math.round(((player.correctAnswersCount || 0) / totalRounds) * 100) 
                      : 0;

                    return (
                      <div key={player.id} className="transition-colors">
                        <div
                          className={`p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-900/60 ${
                            isYou ? 'bg-indigo-950/20' : ''
                          }`}
                          onClick={() => setSelectedPlayerForDetail(isSelected ? null : player.id)}
                        >
                          {/* Left: Rank & Avatar */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 text-center font-mono font-black text-xs text-slate-400">
                              #{rank}
                            </span>
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border border-white/50 shadow flex-shrink-0"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.avatar}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold truncate ${isYou ? 'text-amber-300' : 'text-slate-200'}`}>
                                  {player.name}
                                </span>
                                {isYou && (
                                  <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1 rounded font-mono">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                                <span className="text-amber-300 font-bold">Square {player.position}/{BOARD_SIZE}</span>
                                <span>•</span>
                                <span className="text-slate-400">🐍 {player.snakesHitCount}</span>
                                <span>•</span>
                                <span className="text-slate-400">🪜 {player.laddersClimbedCount}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Key Performance Metrics */}
                          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
                            {/* Average Response Time */}
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-mono text-slate-400 uppercase">Avg Decision Time</span>
                              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>{player.averageResponseTime > 0 ? `${player.averageResponseTime}s` : 'N/A'}</span>
                              </div>
                            </div>

                            {/* Right / Correct Answers Chosen */}
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-mono text-slate-400 uppercase">Right Answers</span>
                              <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>{player.correctAnswersCount || 0} / {totalRounds} ({accuracy}%)</span>
                              </div>
                            </div>

                            {/* Total Points Earned */}
                            <div className="flex flex-col items-end hidden sm:flex">
                              <span className="text-[9px] font-mono text-slate-400 uppercase">Card Points</span>
                              <span className="text-xs font-mono font-black text-indigo-300">
                                {player.totalPointsEarned || 0} PTS
                              </span>
                            </div>

                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-white"
                              title="Toggle breakdown"
                            >
                              {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded details for selected player */}
                        {isSelected && (
                          <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 border-b border-slate-800 pb-1.5">
                              <span className="font-bold">{player.name}'s Round Choices History</span>
                              <span className="text-slate-400">
                                {player.fastestResponseTimeMs 
                                  ? `Fastest Pick: ${(player.fastestResponseTimeMs / 1000).toFixed(1)}s` 
                                  : ''}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {player.cardChoicesHistory && player.cardChoicesHistory.length > 0 ? (
                                player.cardChoicesHistory.map((choice, cIdx) => {
                                  const schemeForRound = cardScheme.find((s) => s.round === choice.round);
                                  const cardOption = choice.cardColor && schemeForRound ? schemeForRound.cards[choice.cardColor] : null;

                                  return (
                                    <div
                                      key={cIdx}
                                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-[10px] text-slate-400 w-14 flex-shrink-0">
                                          Round {choice.round}:
                                        </span>
                                        {choice.cardColor ? (
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${cardBadgeColor[choice.cardColor]}`}>
                                            {choice.cardColor} CARD (+{choice.points} PTS)
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-800">
                                            TIMED OUT (0 PTS)
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-3 font-mono text-[11px] flex-shrink-0">
                                        <span className="text-slate-400">
                                          ⏱️ {(choice.responseTimeMs / 1000).toFixed(1)}s
                                        </span>
                                        {choice.isCorrect ? (
                                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Correct</span>
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-rose-400">
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span>Wrong</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-xs text-slate-500 font-mono py-1">No choices recorded for this player.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'matrix' && (
            /* 4. Complete Matrix of all rounds & player selections */
            <div className="space-y-3">
              {cardScheme.slice(0, totalRounds).map((round) => (
                <div key={round.round} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/30">
                          Round {round.round}
                        </span>
                        {round.correctColor && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Correct Choice: {round.correctColor} CARD</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Player responses for this round */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {sortedPlayers.map((player) => {
                      const choice = player.cardChoicesHistory?.find((c) => c.round === round.round);
                      const isCorrect = choice?.isCorrect ?? false;

                      return (
                        <div
                          key={player.id}
                          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs border border-white/40 flex-shrink-0"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.avatar}
                            </div>
                            <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                              {player.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[10px] flex-shrink-0">
                            {choice?.cardColor ? (
                              <span className={`px-1.5 py-0.5 rounded font-bold border ${cardBadgeColor[choice.cardColor]}`}>
                                {choice.cardColor} (+{choice.points})
                              </span>
                            ) : (
                              <span className="text-slate-500">Timed out</span>
                            )}
                            {isCorrect ? (
                              <span className="text-emerald-400 font-black">✓</span>
                            ) : (
                              <span className="text-rose-400">✗</span>
                            )}
                            <span className="text-slate-400">
                              {choice ? `${(choice.responseTimeMs / 1000).toFixed(1)}s` : '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'evaluation' && (
            /* 5. Game Evaluation & Written Feedback Tab */
            <div className="space-y-4">
              {/* Header Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg shadow-amber-400/10">
                    <Star className="w-6 h-6 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Game Evaluation & Suggestions</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[10px] border border-amber-400/30">
                        1-5 Stars (5 is Highest)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rate this match and provide written feedback on how to make the gameplay better.
                    </p>
                  </div>
                </div>

                {/* Score badge summary */}
                <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Average Rating</div>
                    <div className="text-sm font-black font-mono text-amber-300 flex items-center justify-end gap-1">
                      <span>{averageRating}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                  <div className="h-7 w-px bg-slate-800" />
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Reviews</div>
                    <div className="text-sm font-black font-mono text-white">{totalEvaluations}</div>
                  </div>
                </div>
              </div>

              {/* Submit / Edit Your Evaluation Form */}
              <form
                id="game-evaluation-form"
                onSubmit={handleSubmitEval}
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{myExistingEval ? 'Your Submitted Evaluation' : 'Leave Your Evaluation'}</span>
                  </span>
                  {myExistingEval && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Submitted</span>
                    </span>
                  )}
                </div>

                {/* Star Rating Control (1 to 5 Stars) */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Rating (1 to 5 Stars — 5 Stars is Highest):
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-2 bg-slate-900 rounded-xl border border-slate-800 inline-flex">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isFilled = (hoverRating || rating) >= starValue;
                        return (
                          <button
                            key={starValue}
                            id={`star-rating-btn-${starValue}`}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setRating(starValue);
                            }}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 transition-all transform hover:scale-110 active:scale-95 focus:outline-none"
                            title={`${starValue} Star${starValue > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                  : 'text-slate-600 hover:text-slate-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs font-mono text-amber-300 font-semibold px-2 py-1 bg-amber-400/10 rounded-lg border border-amber-400/20">
                      {ratingDescriptions[hoverRating || rating] || `${rating} Stars`}
                    </span>
                  </div>
                </div>

                {/* Evaluator Name Input */}
                <div>
                  <label htmlFor="evaluator-name-input" className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Evaluator Name:</span>
                  </label>
                  <input
                    id="evaluator-name-input"
                    type="text"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={30}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Written Feedback Textarea */}
                <div>
                  <label htmlFor="feedback-textarea" className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Written Feedback (How to make it better):</span>
                  </label>
                  <textarea
                    id="feedback-textarea"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your thoughts on card colors, timing, question format, ladder mechanics, or ideas to make the next match more exciting..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 font-sans text-xs focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Submit button & confirmation */}
                <div className="flex items-center justify-between pt-1">
                  {submitSuccessMsg ? (
                    <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                      <Check className="w-4 h-4" />
                      <span>Evaluation saved & shared with host!</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500">
                      Evaluations are stored with the evaluator&apos;s name and shared.
                    </span>
                  )}

                  <button
                    id="submit-evaluation-btn"
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black font-mono text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-95 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{myExistingEval ? 'UPDATE EVALUATION' : 'SUBMIT EVALUATION'}</span>
                  </button>
                </div>
              </form>

              {/* All Evaluator Reviews List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Evaluations & Feedback ({evaluations.length})</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    {evaluations.length === 0 ? 'No reviews submitted yet' : `${evaluations.length} player review(s)`}
                  </span>
                </div>

                {evaluations.length === 0 ? (
                  <div className="p-6 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-center space-y-1">
                    <p className="text-xs font-mono text-slate-400">Be the first to evaluate this match!</p>
                    <p className="text-[11px] text-slate-500">Rate 1-5 stars and share how to improve the game.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {evaluations.map((evalItem) => {
                      const isMe = evalItem.playerId === currentPlayerId;
                      return (
                        <div
                          key={evalItem.id}
                          className={`p-3 rounded-2xl border transition-all ${
                            isMe
                              ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-amber-300">
                                {evalItem.evaluatorName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {evalItem.evaluatorName}
                                  </span>
                                  {isMe && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/30">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  {new Date(evalItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>

                            {/* Star display */}
                            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= evalItem.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-700'
                                  }`}
                                />
                              ))}
                              <span className="text-[10px] font-mono font-bold text-amber-300 ml-1">
                                {evalItem.rating}/5
                              </span>
                            </div>
                          </div>

                          {/* Written Feedback content */}
                          {evalItem.feedback ? (
                            <div className="mt-2 pt-2 border-t border-slate-800/80">
                              <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                                &ldquo;{evalItem.feedback}&rdquo;
                              </p>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <span className="text-[11px] text-slate-500 italic">No additional written comments provided.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <Eye className="w-4 h-4" />
            <span>View Board</span>
          </button>

          {isAdmin && (
            <button
              id="start-new-match-btn"
              type="button"
              onClick={() => {
                sounds.playClick();
                onRestartGame();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-indigo-500 to-violet-600 hover:from-amber-300 hover:to-violet-500 text-slate-950 font-black font-mono text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>START NEW MATCH</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
