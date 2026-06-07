import React from 'react';
import { Play, Pause, Square, BellRing } from 'lucide-react';

interface TimerCircleProps {
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  isRinging: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export default function TimerCircle({
  secondsRemaining,
  totalSeconds,
  isRunning,
  isRinging,
  onStart,
  onPause,
  onStop,
}: TimerCircleProps) {
  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate percentage of progress
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 1;
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~282.74
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-6">
      {/* Circle display */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
        {/* Ambient background glow */}
        <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 transition-all duration-1000 ${
          isRinging 
            ? 'bg-rose-500 scale-110 animate-pulse' 
            : isRunning 
              ? 'bg-indigo-500 scale-100' 
              : 'bg-indigo-950 scale-90'
        }`} />

        <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.15)]" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <linearGradient id="ringingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(30, 41, 59, 0.6)"
            strokeWidth="5"
            fill="transparent"
            className="backdrop-blur-sm"
          />

          {/* Progress Path */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={isRinging ? 'url(#ringingGrad)' : 'url(#progressGrad)'}
            strokeWidth="5.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#glow)"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Text inside the circle */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300/70">
            {isRinging ? '起きてください！' : isRunning ? '昼寝中' : secondsRemaining < totalSeconds ? '一時停止中' : '準備完了'}
          </span>
          <span className={`text-4xl sm:text-5xl font-extrabold tracking-tighter text-white mt-1 font-mono ${
            isRinging ? 'animate-bounce text-rose-200' : ''
          }`}>
            {formatTime(secondsRemaining)}
          </span>
          <span className="text-[10px] font-medium text-slate-400 mt-1">
            目標: {Math.round(totalSeconds / 60)}分
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
        {isRinging ? (
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold tracking-wide shadow-lg shadow-rose-500/20 active:scale-95 transition-all duration-200 cursor-pointer animate-pulse"
          >
            <BellRing className="w-5 h-5 animate-bounce" />
            <span>アラームを止める</span>
          </button>
        ) : (
          <div className="flex justify-center items-center space-x-6 w-full">
            {/* Reset / Stop Button */}
            {(isRunning || secondsRemaining < totalSeconds) && (
              <button
                onClick={onStop}
                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900/60 border border-slate-700/50 hover:bg-slate-800/60 text-slate-300 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
                title="タイマーをリセット"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            )}

            {/* Play / Pause Button */}
            {isRunning ? (
              <button
                onClick={onPause}
                className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all duration-300 cursor-pointer"
                title="一時停止"
              >
                <Pause className="w-8 h-8 fill-current" />
              </button>
            ) : (
              <button
                onClick={onStart}
                className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all duration-300 cursor-pointer"
                title="開始"
              >
                <Play className="w-8 h-8 ml-1 fill-current" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
