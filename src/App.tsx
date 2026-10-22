import React, { useState, useEffect, useRef } from 'react';
import { GameMode, KillFeedItem, MapId, NetworkMatchResult, PlayerState, RoomInfo, UserProfile } from './types/game';
import { BomaBattleEngine } from './game/engine';
import { sound } from './game/audio';
import { loadUserProfile, saveUserProfile, recordMatchProgression } from './game/progression';
import { Navbar } from './ui/Navbar';
import { MainMenu } from './ui/MainMenu';
import { CharacterScreen } from './ui/CharacterScreen';
import { ArmoryScreen } from './ui/ArmoryScreen';
import { MapSelectScreen } from './ui/MapSelectScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { MultiplayerModal } from './ui/MultiplayerModal';
import { InGameHUD } from './ui/InGameHUD';
import { PauseModal } from './ui/PauseModal';
import { GameOverModal } from './ui/GameOverModal';
import { MultiplayerClient } from './game/multiplayerClient';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [currentTab, setCurrentTab] = useState<'home' | 'armory' | 'warriors' | 'maps' | 'settings'>('home');
  const [selectedMap, setSelectedMap] = useState<MapId>('lusaka');
  const [selectedMode, setSelectedMode] = useState<GameMode>('practice');

  // Match State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winnerName, setWinnerName] = useState<string>('');
  const [networkResult, setNetworkResult] = useState<NetworkMatchResult | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [multiplayerModalOpen, setMultiplayerModalOpen] = useState(false);

  // In-Game Live State
  const [localPlayer, setLocalPlayer] = useState<PlayerState | undefined>(undefined);
  const [allPlayers, setAllPlayers] = useState<PlayerState[]>([]);
  const [teamScores, setTeamScores] = useState({ green: 0, copper: 0 });
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BomaBattleEngine | null>(null);
  const multiClientRef = useRef<MultiplayerClient | null>(null);

  // Sync Audio Volumes on Mount
  useEffect(() => {
    sound.setVolumes(1.0, profile.soundVolume, profile.musicVolume, profile.announcerVolume);
  }, [profile]);

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveUserProfile(updated);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      sound.setVolumes(1.0, profile.soundVolume, profile.musicVolume, profile.announcerVolume);
      setIsMuted(false);
    } else {
      sound.setVolumes(0, 0, 0, 0);
      setIsMuted(true);
    }
  };

  // Start / Deploy Match
  const handleStartGame = (
    mode: GameMode = 'practice',
    mapId: MapId = selectedMap,
    multiClient?: MultiplayerClient,
    initialPlayers?: PlayerState[]
  ) => {
    setSelectedMode(mode);
    setSelectedMap(mapId);
    setIsPlaying(true);
    setIsPaused(false);
    setIsGameOver(false);
    setNetworkResult(null);
    setKillFeed([]);

    // Give react time to mount the canvas
    setTimeout(() => {
      initGameEngine(mode, mapId, multiClient, initialPlayers);
    }, 50);
  };

  const initGameEngine = (
    mode: GameMode,
    mapId: MapId,
    multiClient?: MultiplayerClient,
    initialPlayers?: PlayerState[]
  ) => {
    if (!canvasRef.current) return;

    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new BomaBattleEngine(canvas, mode, mapId, {
      name: profile.name,
      characterId: profile.selectedCharacter,
      skinId: profile.selectedSkin,
    });

    if (multiClient) {
      engine.setMultiplayerClient(multiClient, initialPlayers);
    }

    engine.callbacks = {
      onScoreUpdate: (players, scores) => {
        setAllPlayers([...players]);
        setLocalPlayer(players.find((p) => p.id === engine.localPlayerId));
        setTeamScores({ ...scores });
        setTimeRemaining(engine.matchTimeRemaining);
      },
      onKillFeed: (feedItem) => {
        setKillFeed((prev) => [feedItem, ...prev.slice(0, 4)]);
      },
      onGameOver: (winner, scores, netResult) => {
        setWinnerName(winner);
        setNetworkResult(netResult || null);
        setIsGameOver(true);

        const local = engine.getLocalPlayer();
        const isWinner =
          local &&
          (winner.includes(local.name) ||
            (local.team === 'green' && winner.includes('Green')) ||
            (local.team === 'copper' && winner.includes('Copper')));

        const result = recordMatchProgression(
          profile,
          local?.kills || 0,
          local?.deaths || 0,
          !!isWinner,
          local?.damageDealt || 0
        );

        setProfile(result.updatedProfile);
        setXpEarned(result.xpEarned);
        setLeveledUp(result.leveledUp);
      },
    };

    engineRef.current = engine;
    engine.start();

    // Resize listener
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
  };

  // Multiplayer Launch
  const handleStartMultiplayerMatch = (
    room: RoomInfo,
    client: MultiplayerClient,
    initialPlayers?: PlayerState[]
  ) => {
    multiClientRef.current = client;
    setMultiplayerModalOpen(false);
    handleStartGame(room.mode, room.mapId, client, initialPlayers);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleExitMatch = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    if (multiClientRef.current) {
      multiClientRef.current.disconnect();
      multiClientRef.current = null;
    }
    sound.stopMusic();
    sound.stopJetpack();
    setIsPlaying(false);
    setIsPaused(false);
    setIsGameOver(false);
  };

  const handlePlayAgain = () => {
    setIsGameOver(false);
    handleStartGame(selectedMode, selectedMap);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Top Navbar */}
      {!isPlaying && (
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isPlaying={isPlaying}
          onQuickPlay={() => handleStartGame('practice', selectedMap)}
          profile={profile}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {isPlaying ? (
          /* Active Game Canvas and HUD */
          <div className="relative w-full h-full">
            <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

            {/* In-Game HUD */}
            <InGameHUD
              player={localPlayer}
              allPlayers={allPlayers}
              teamScores={teamScores}
              timeRemaining={timeRemaining}
              mode={selectedMode}
              map={engineRef.current?.map || ({} as any)}
              killFeed={killFeed}
              onPause={handlePause}
              onReload={() => {
                if (engineRef.current && localPlayer) {
                  engineRef.current.triggerReload(localPlayer);
                }
              }}
              onCycleWeapon={() => {
                if (engineRef.current && localPlayer) {
                  engineRef.current.cycleWeapon(localPlayer);
                }
              }}
              onThrowGrenade={() => {
                if (engineRef.current && localPlayer) {
                  engineRef.current.throwGrenade(localPlayer);
                }
              }}
            />

            {/* Pause Modal */}
            <PauseModal
              isOpen={isPaused}
              onResume={handleResume}
              onExit={handleExitMatch}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
            />

            {/* Game Over Modal */}
            {isGameOver && (
              <GameOverModal
                winnerName={winnerName}
                localPlayer={localPlayer}
                teamScores={teamScores}
                networkResult={networkResult}
                xpEarned={xpEarned}
                leveledUp={leveledUp}
                profile={profile}
                onPlayAgain={handlePlayAgain}
                onHome={handleExitMatch}
              />
            )}
          </div>
        ) : (
          /* Tab Screens */
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentTab === 'home' && (
              <MainMenu
                onStartGame={handleStartGame}
                onOpenMultiplayer={() => setMultiplayerModalOpen(true)}
                profile={profile}
                selectedMap={selectedMap}
                setSelectedMap={setSelectedMap}
                onGoToWarriors={() => setCurrentTab('warriors')}
                onGoToArmory={() => setCurrentTab('armory')}
              />
            )}

            {currentTab === 'warriors' && (
              <CharacterScreen
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'armory' && (
              <ArmoryScreen onBack={() => setCurrentTab('home')} />
            )}

            {currentTab === 'maps' && (
              <MapSelectScreen
                selectedMap={selectedMap}
                onSelectMap={setSelectedMap}
                onStartMatch={handleStartGame}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsScreen
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onBack={() => setCurrentTab('home')}
              />
            )}
          </div>
        )}
      </main>

      {/* Real-time Multiplayer Modal */}
      <MultiplayerModal
        isOpen={multiplayerModalOpen}
        onClose={() => setMultiplayerModalOpen(false)}
        profile={profile}
        onStartMultiplayerMatch={handleStartMultiplayerMatch}
      />
    </div>
  );
}
