import React from 'react';
import { Trophy, RotateCcw, Home, Sparkles, Award, Shield } from 'lucide-react';
import { NetworkMatchResult, PlayerState, UserProfile } from '../types/game';

interface GameOverModalProps {
  winnerName: string;
  localPlayer: PlayerState | undefined;
  teamScores?: { green: number; copper: number };
  networkResult?: NetworkMatchResult | null;
  xpEarned: number;
  leveledUp: boolean;
  profile: UserProfile;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winnerName,
  localPlayer,
  networkResult,
  xpEarned,
  leveledUp,
  profile,
  onPlayAgain,
  onHome,
}) => {
  const isWinner =
    localPlayer &&
    (winnerName.includes(localPlayer.name) ||
      (localPlayer.team === 'green' && winnerName.includes('Green')) ||
      (localPlayer.team === 'copper' && winnerName.includes('Copper')));

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 my-auto">
        {/* Victory / Defeat Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-2">
            <Trophy className={`w-8 h-8 ${isWinner ? 'text-amber-400' : 'text-neutral-500'}`} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            {isWinner ? 'Victory Secured!' : 'Battle Concluded'}
          </h2>
          <p className="text-sm text-amber-400 font-bold uppercase tracking-wider">
            {winnerName}
          </p>
        </div>

        {/* Multiplayer Leaderboard or Local Player Stats */}
        {networkResult?.leaderboard && networkResult.leaderboard.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-neutral-400">
              <span className="flex items-center gap-1.5 text-white">
                <Award className="w-4 h-4 text-amber-400" /> Match Scoreboard
              </span>
              {networkResult.mvp && (
                <span className="text-amber-400">
                  MVP: <span className="font-extrabold text-white">{networkResult.mvp.name}</span>
                </span>
              )}
            </div>

            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Warrior</th>
                    <th className="py-2 px-3 text-center">Team</th>
                    <th className="py-2 px-3 text-center">K</th>
                    <th className="py-2 px-3 text-center">D</th>
                    <th className="py-2 px-3 text-right">Damage</th>
                    <th className="py-2 px-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {networkResult.leaderboard.map((entry, idx) => {
                    const isLocal = localPlayer && entry.id === localPlayer.id;
                    const isMvp = networkResult.mvp && entry.id === networkResult.mvp.id;
                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          isLocal
                            ? 'bg-amber-500/10 font-bold text-white'
                            : 'hover:bg-neutral-800/40 text-neutral-300'
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-neutral-400">{idx + 1}</td>
                        <td className="py-2 px-3 flex items-center gap-1.5">
                          <span>{entry.name}</span>
                          {isMvp && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded font-black">
                              MVP
                            </span>
                          )}
                          {isLocal && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded font-black">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {entry.team !== 'none' ? (
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                entry.team === 'green'
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                                  : 'bg-orange-950/80 text-orange-400 border border-orange-800/60'
                              }`}
                            >
                              {entry.team}
                            </span>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-emerald-400">{entry.kills}</td>
                        <td className="py-2 px-3 text-center font-mono text-rose-400">{entry.deaths}</td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-300">{entry.damageDealt}</td>
                        <td className="py-2 px-3 text-right font-mono text-sky-400 font-bold">{entry.score}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          localPlayer && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Kills</span>
                <span className="text-xl font-mono font-bold text-emerald-400">{localPlayer.kills}</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Deaths</span>
                <span className="text-xl font-mono font-bold text-rose-400">{localPlayer.deaths}</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">K/D</span>
                <span className="text-xl font-mono font-bold text-amber-400">
                  {localPlayer.deaths === 0
                    ? localPlayer.kills
                    : (localPlayer.kills / localPlayer.deaths).toFixed(1)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Score</span>
                <span className="text-xl font-mono font-bold text-sky-400">{localPlayer.score}</span>
              </div>
            </div>
          )
        )}

        {/* XP and Level Progression */}
        <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> XP Earned
            </span>
            <span className="text-emerald-400 font-bold font-mono">+{xpEarned} XP</span>
          </div>

          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full transition-all"
              style={{ width: `${Math.min(100, (profile.xp / profile.xpToNextLevel) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Warrior Level {profile.level}</span>
            {leveledUp && (
              <span className="text-amber-400 font-bold uppercase animate-pulse">
                Rank Up Achieved!
              </span>
            )}
            <span>
              {profile.xp} / {profile.xpToNextLevel} XP
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onHome}
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs uppercase rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
