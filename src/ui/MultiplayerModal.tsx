import React, { useState, useEffect } from 'react';
import { X, Users, Copy, Check, MessageSquare, Shield, Globe, Play } from 'lucide-react';
import { GameMode, MapId, PlayerState, RoomInfo, UserProfile } from '../types/game';
import { MultiplayerClient } from '../game/multiplayerClient';
import { sound } from '../game/audio';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onStartMultiplayerMatch: (room: RoomInfo, client: MultiplayerClient, players: PlayerState[]) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  profile,
  onStartMultiplayerMatch,
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('create');
  const [roomName, setRoomName] = useState(`${profile.name}'s Boma`);
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<GameMode>('ffa');
  const [mapId, setMapId] = useState<MapId>('lusaka');

  const [client, setClient] = useState<MultiplayerClient | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (client) {
        client.disconnect();
        setClient(null);
        setRoom(null);
      }
      return;
    }

    const netClient = new MultiplayerClient({
      onRoomCreated: (code, playerId, roomInfo, initPlayers) => {
        setRoom(roomInfo);
        setPlayers(initPlayers);
        setErrorMessage(null);
        sound.playAnnouncer('Boma secured!');
      },
      onRoomJoined: (code, playerId, roomInfo, initPlayers) => {
        setRoom(roomInfo);
        setPlayers(initPlayers);
        setErrorMessage(null);
        sound.playAnnouncer('Eya, let\'s go!');
      },
      onPlayerJoined: (newPlayer) => {
        setPlayers((prev) => [...prev.filter((p) => p.id !== newPlayer.id), newPlayer]);
        sound.playPickup('armor');
      },
      onPlayerLeft: (leftPlayerId) => {
        setPlayers((prev) => prev.filter((p) => p.id !== leftPlayerId));
      },
      onMatchStarted: () => {
        if (room && netClient) {
          onStartMultiplayerMatch(room, netClient, players);
        }
      },
      onChat: (sender, text) => {
        setChatMessages((prev) => [...prev, { sender, text }]);
      },
      onError: (msg) => {
        setErrorMessage(msg);
      },
    });

    setIsConnecting(true);
    netClient.connect().then((connected) => {
      setIsConnecting(false);
      if (connected) {
        setClient(netClient);
      } else {
        setErrorMessage('Could not connect to multiplayer server. Please check internet connection.');
      }
    });

    return () => {
      netClient.disconnect();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    if (!client) return;
    client.createRoom(roomName, profile.name, profile.selectedCharacter, mode, mapId);
  };

  const handleJoinRoom = () => {
    if (!client || !joinCode.trim()) return;
    client.joinRoom(joinCode.trim().toUpperCase(), profile.name, profile.selectedCharacter);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !chatInput.trim()) return;
    client.sendChat(chatInput.trim());
    setChatMessages((prev) => [...prev, { sender: profile.name, text: chatInput.trim() }]);
    setChatInput('');
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isHost = room?.hostId === client?.playerId;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">
              Real-Time Multiplayer Rooms
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!room ? (
            /* Room Setup / Join Form */
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800 max-w-xs mx-auto">
                <button
                  onClick={() => setTab('create')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    tab === 'create'
                      ? 'bg-neutral-800 text-white shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Create Room
                </button>
                <button
                  onClick={() => setTab('join')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    tab === 'join'
                      ? 'bg-neutral-800 text-white shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Join via Code
                </button>
              </div>

              {tab === 'create' ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Room Name</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Game Mode</label>
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as GameMode)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ffa">Free-for-All</option>
                        <option value="tdm">Team Deathmatch</option>
                        <option value="capture_boma">Capture the Boma</option>
                        <option value="survival">Last Warrior Standing</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Battleground</label>
                      <select
                        value={mapId}
                        onChange={(e) => setMapId(e.target.value as MapId)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="lusaka">Lusaka Outskirts</option>
                        <option value="copperbelt">Copperbelt Mines</option>
                        <option value="victoria_falls">Victoria Falls Frontier</option>
                        <option value="kafue">Kafue Wildlands</option>
                        <option value="lake_kariba">Lake Kariba</option>
                        <option value="south_luangwa">South Luangwa Safari</option>
                        <option value="muchinga">Muchinga Escarpment</option>
                        <option value="bangweulu">Bangweulu Wetlands</option>
                        <option value="training_camp">Boma Training Camp</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    disabled={isConnecting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase rounded-xl transition-all shadow-lg shadow-emerald-950/50"
                  >
                    {isConnecting ? 'Connecting...' : 'Create Room & Generate Code'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Enter 6-Letter Room Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. ZAM44B"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full text-center text-2xl font-mono font-bold tracking-widest uppercase bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={handleJoinRoom}
                    disabled={joinCode.trim().length < 4 || isConnecting}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-sm uppercase rounded-xl transition-all shadow-lg shadow-orange-950/50"
                  >
                    {isConnecting ? 'Connecting...' : 'Join Room'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Active Lobby Room Screen */
            <div className="space-y-6">
              {/* Room Header Info */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800 gap-4">
                <div>
                  <div className="text-xs text-neutral-400 uppercase font-semibold">
                    {room.mode.toUpperCase()} · {room.mapId.toUpperCase()}
                  </div>
                  <h3 className="text-lg font-bold text-white">{room.name}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block">Invite Code</span>
                    <span className="text-xl font-mono font-black text-amber-400 tracking-wider">
                      {room.code}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                    title="Copy Room Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Grid: Players List & Live Room Chat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Players In Lobby */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-2">
                    <span className="flex items-center gap-1.5 font-bold uppercase text-white">
                      <Users className="w-3.5 h-3.5 text-emerald-400" /> Warriors ({players.length}/8)
                    </span>
                    <span>{isHost ? 'You are Host' : 'Joined'}</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Shield
                            className={`w-3.5 h-3.5 ${
                              p.team === 'green'
                                ? 'text-emerald-400'
                                : p.team === 'copper'
                                ? 'text-orange-400'
                                : 'text-neutral-400'
                            }`}
                          />
                          <span className="font-semibold text-white">{p.name}</span>
                          {p.id === room.hostId && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                              HOST
                            </span>
                          )}
                        </div>
                        <span className="text-neutral-500 font-mono">Ready</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lobby Chat */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex flex-col justify-between space-y-2 h-64">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-white border-b border-neutral-800 pb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Room Comms
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {chatMessages.length === 0 ? (
                      <div className="text-neutral-500 italic text-center py-8">
                        No messages yet. Say hello to fellow Zambian warriors!
                      </div>
                    ) : (
                      chatMessages.map((c, i) => (
                        <div key={i} className="text-neutral-300">
                          <span className="font-bold text-amber-400">{c.sender}: </span>
                          <span>{c.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-neutral-800">
                    <input
                      type="text"
                      placeholder="Send chat message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-semibold"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>

              {/* Host Start Action */}
              <div className="pt-2">
                {isHost ? (
                  <button
                    onClick={() => {
                      if (client) {
                        client.startMatch();
                        onStartMultiplayerMatch(room, client, players);
                      }
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase rounded-xl transition-all shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Multiplayer Match</span>
                  </button>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
                    Waiting for room host to deploy the match...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
