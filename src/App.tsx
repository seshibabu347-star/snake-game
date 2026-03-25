import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Trophy, Gamepad2, Music, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

// --- Constants & Data ---
const GRID_SIZE = 20;
const GAME_SPEED = 120; // ms per tick

const TRACKS = [
  {
    id: 1,
    title: "Neon Grid - AI Gen Alpha",
    artist: "SynthMind",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "6:12"
  },
  {
    id: 2,
    title: "Cybernetic Pulse - AI Gen Beta",
    artist: "NeuralNet",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "7:05"
  },
  {
    id: 3,
    title: "Digital Horizon - AI Gen Gamma",
    artist: "AlgorithmX",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "5:44"
  }
];

export default function App() {
  // --- Audio Player State ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // --- Snake Game State ---
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Use refs for direction to avoid dependency cycle issues in the game loop
  const dirRef = useRef({ x: 0, y: -1 });
  const lastProcessedDirRef = useRef({ x: 0, y: -1 });

  // --- Audio Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(err => {
        console.warn("Autoplay blocked by browser:", err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  // --- Snake Game Logic ---
  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    dirRef.current = { x: 0, y: -1 };
    lastProcessedDirRef.current = { x: 0, y: -1 };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    spawnFood([{ x: 10, y: 10 }]);
  };

  const spawnFood = (currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Ensure food doesn't spawn on the snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
        if (gameStarted && !gameOver) {
          e.preventDefault();
        }
      }

      if (!gameStarted || gameOver) return;

      const lastDir = lastProcessedDirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (lastDir.y !== 1) dirRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (lastDir.y !== -1) dirRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (lastDir.x !== 1) dirRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (lastDir.x !== -1) dirRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  // Game Loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const currentDir = dirRef.current;
        lastProcessedDirRef.current = currentDir;
        
        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // Check wall collision
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          handleGameOver();
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          spawnFood(newSnake);
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, food]);

  const handleGameOver = () => {
    setGameOver(true);
    setGameStarted(false);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-400 font-mono flex flex-col overflow-hidden selection:bg-pink-500/30">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={TRACKS[currentTrackIndex].url}
        onEnded={handleTrackEnd}
      />

      {/* Header */}
      <header className="w-full p-6 border-b border-cyan-900/50 bg-gray-900/50 backdrop-blur-md z-10 flex justify-between items-center shadow-[0_4px_30px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
          <h1 
            className="text-4xl md:text-5xl font-digital tracking-widest text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] glitch-text"
            data-text="NEON_SNAKE // SYNTH"
          >
            NEON_SNAKE // SYNTH
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">HI-SCORE: {highScore}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Panel: Music Player */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
          <div className="bg-gray-900/60 border border-pink-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(236,72,153,0.15)] backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-3 mb-6">
              <Music className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-semibold text-pink-400 tracking-wider">NOW PLAYING</h2>
            </div>

            {/* Fake Visualizer */}
            <div className="flex items-end justify-between h-16 mb-6 gap-1">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isPlaying ? ["15%", "100%", "30%", "80%", "20%"] : "10%" 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8 + Math.random() * 0.5, 
                    ease: "easeInOut",
                    delay: Math.random() * 0.5
                  }}
                  className="w-full bg-gradient-to-t from-purple-600 to-pink-400 rounded-t-sm shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                />
              ))}
            </div>

            <div className="space-y-1 mb-6">
              <h3 className="text-cyan-300 font-bold truncate drop-shadow-[0_0_5px_rgba(103,232,249,0.5)]">
                {TRACKS[currentTrackIndex].title}
              </h3>
              <p className="text-xs text-cyan-600/80 truncate">
                {TRACKS[currentTrackIndex].artist}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={prevTrack}
                className="p-2 text-cyan-500 hover:text-pink-400 hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] transition-all"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-pink-500/10 border border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-gray-950 hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              
              <button 
                onClick={nextTrack}
                className="p-2 text-cyan-500 hover:text-pink-400 hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.8)] transition-all"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 text-cyan-600">
              <button onClick={() => setIsMuted(!isMuted)} className="hover:text-cyan-400 transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>

          {/* Track List */}
          <div className="bg-gray-900/40 border border-cyan-900/30 rounded-xl p-4 hidden lg:block">
            <h4 className="text-xs text-cyan-600 mb-3 tracking-widest">TRACKLIST</h4>
            <div className="space-y-2">
              {TRACKS.map((track, idx) => (
                <div 
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`flex justify-between items-center p-2 rounded cursor-pointer text-xs transition-colors ${
                    idx === currentTrackIndex 
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' 
                      : 'text-gray-500 hover:text-cyan-400 hover:bg-gray-800'
                  }`}
                >
                  <span className="truncate pr-2">{track.title}</span>
                  <span className="opacity-50">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: Snake Game */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
          
          {/* Mobile Score Header */}
          <div className="flex md:hidden w-full justify-between items-center mb-4 px-4">
            <div className="text-xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
              SCORE: {score}
            </div>
            <div className="text-sm text-yellow-400">
              HI: {highScore}
            </div>
          </div>

          <div className="relative w-full max-w-[450px] aspect-square bg-gray-950 border-2 border-cyan-500/50 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden">
            {/* Grid Background Pattern */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
                backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
              }}
            />

            {/* Snake */}
            {snake.map((segment, i) => {
              const isHead = i === 0;
              return (
                <div
                  key={i}
                  className={`absolute rounded-sm transition-all duration-75 ${
                    isHead 
                      ? 'bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,1)] z-10' 
                      : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] opacity-90'
                  }`}
                  style={{
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    transform: 'scale(0.9)' // slight gap between segments
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="absolute bg-pink-500 rounded-full shadow-[0_0_20px_rgba(236,72,153,1)] animate-pulse"
              style={{
                left: `${(food.x / GRID_SIZE) * 100}%`,
                top: `${(food.y / GRID_SIZE) * 100}%`,
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                transform: 'scale(0.8)'
              }}
            />

            {/* Overlays */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <Gamepad2 className="w-16 h-16 text-cyan-400 mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                <h2 className="text-2xl font-bold text-white mb-6 tracking-widest">READY?</h2>
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold rounded hover:bg-cyan-400 hover:text-gray-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] transition-all"
                >
                  START SYSTEM
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
                <h2 className="text-4xl font-black text-pink-500 mb-2 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] tracking-widest">
                  GAME OVER
                </h2>
                <p className="text-cyan-300 mb-8 text-lg">FINAL SCORE: {score}</p>
                <button 
                  onClick={startGame}
                  className="flex items-center gap-2 px-6 py-3 bg-pink-500/10 border border-pink-500 text-pink-400 font-bold rounded hover:bg-pink-500 hover:text-gray-950 hover:shadow-[0_0_20px_rgba(236,72,153,0.8)] transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  REBOOT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Score & Controls Info */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-3">
          <div className="bg-gray-900/60 border border-cyan-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] backdrop-blur-sm hidden md:block">
            <h3 className="text-sm text-cyan-600 tracking-widest mb-2">CURRENT SCORE</h3>
            <div className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
              {score.toString().padStart(4, '0')}
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 tracking-widest mb-4">CONTROLS</h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-cyan-200">W</kbd>
                  <span>UP</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-cyan-200">S</kbd>
                  <span>DOWN</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-cyan-200">A</kbd>
                  <span>LEFT</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-cyan-200">D</kbd>
                  <span>RIGHT</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 justify-center border-l border-gray-800 pl-4">
                <p>Or use <span className="text-cyan-400">Arrow Keys</span></p>
                <p className="mt-2 text-pink-500/80">Eat pink nodes to increase score and length.</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
