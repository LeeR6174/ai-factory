'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, Settings as SettingsIcon, Moon, Zap } from 'lucide-react';
import PresetSelector from '../components/PresetSelector';
import TimerCircle from '../components/TimerCircle';
import HistorySection, { NapHistoryItem } from '../components/HistorySection';
import SettingsSection from '../components/SettingsSection';
import { playAlarm, stopAlarm } from '../utils/audio';

interface SettingsData {
  id: string;
  presetDuration: number;
  alarmSound: string;
  volume: number;
}

interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState<'timer' | 'history' | 'settings'>('timer');
  
  // Settings State
  const [settings, setSettings] = useState<SettingsData>({
    id: 'default',
    presetDuration: 20,
    alarmSound: 'chime',
    volume: 0.5,
  });

  // Timer State
  const [selectedDuration, setSelectedDuration] = useState(20);
  const [totalSeconds, setTotalSeconds] = useState(20 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [expectedEndTime, setExpectedEndTime] = useState<number | null>(null);

  // History State
  const [history, setHistory] = useState<NapHistoryItem[]>([]);

  // Refs for tracking
  const intervalRef = useRef<number | null>(null);

  // Helper Functions declared first to prevent hoisting/reference issues

  // 1. History Helpers
  const addHistoryEntry = (duration: number, status: 'completed' | 'cancelled') => {
    const newItem: NapHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      duration,
      status,
    };
    
    setHistory((prev) => {
      const updated = [newItem, ...prev];
      localStorage.setItem('powernap_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('powernap_history');
  };

  // 2. Settings Saver API handler
  const handleUpdateSettings = async (newSettings: Partial<SettingsData>): Promise<boolean> => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    // If default preset duration changed, and timer is not running/dirty, update it
    if (newSettings.presetDuration !== undefined && !isRunning && secondsRemaining === totalSeconds) {
      setSelectedDuration(newSettings.presetDuration);
      setTotalSeconds(newSettings.presetDuration * 60);
      setSecondsRemaining(newSettings.presetDuration * 60);
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(merged),
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to save settings via API:', e);
      return false;
    }
  };

  // 3. Timer Controller Functions
  const handleSelectPreset = (minutes: number) => {
    if (isRunning || isRinging) return;
    setSelectedDuration(minutes);
    setTotalSeconds(minutes * 60);
    setSecondsRemaining(minutes * 60);
  };

  const handleStartTimer = () => {
    if (isRinging) return;
    
    // Unlock Audio Context on iOS/Safari by doing dummy check
    if (typeof window !== 'undefined') {
      const extWindow = window as unknown as ExtendedWindow;
      const AudioCtx = window.AudioContext || extWindow.webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        if (dummyCtx.state === 'suspended') {
          dummyCtx.resume();
        }
      }
    }

    const endTime = Date.now() + secondsRemaining * 1000;
    setExpectedEndTime(endTime);
    setIsRunning(true);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
    setExpectedEndTime(null);
  };

  const handleStopTimer = () => {
    // If the timer has been running for at least 5 seconds, log as cancelled
    const elapsedSeconds = totalSeconds - secondsRemaining;
    if ((isRunning || secondsRemaining < totalSeconds) && elapsedSeconds >= 5 && !isRinging) {
      addHistoryEntry(selectedDuration, 'cancelled');
    }

    stopAlarm();
    setIsRunning(false);
    setIsRinging(false);
    setExpectedEndTime(null);
    setSecondsRemaining(selectedDuration * 60);
  };

  // Effects declared after helpers

  // Effect 1: Initial Load (Mounted & Load Data)
  useEffect(() => {
    // Fetch settings from API
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.presetDuration) {
          setSettings(data);
          setSelectedDuration(data.presetDuration);
          setTotalSeconds(data.presetDuration * 60);
          setSecondsRemaining(data.presetDuration * 60);
        }
      })
      .catch((err) => console.error('Failed to load settings from API:', err));

    // Defer state updates to bypass SSR/hydration cascading rendering lint warnings
    setTimeout(() => {
      setMounted(true);
      
      // Fetch history from localStorage
      const savedHistory = localStorage.getItem('powernap_history');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse history:', e);
        }
      }
    }, 0);
  }, []);

  // Effect 2: Timer Loop (Ticking & Completion)
  useEffect(() => {
    if (isRunning && expectedEndTime !== null) {
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((expectedEndTime - now) / 1000));
        
        if (diff !== secondsRemaining) {
          setSecondsRemaining(diff);
        }

        if (diff === 0) {
          // Timer finished!
          setIsRunning(false);
          setIsRinging(true);
          
          // Trigger alarm sound
          playAlarm(settings.alarmSound, settings.volume);
          
          // Log to history
          addHistoryEntry(selectedDuration, 'completed');
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, expectedEndTime, secondsRemaining, settings, selectedDuration]);

  // Effect 3: Tab Sync & Background visibility tab tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && expectedEndTime !== null) {
        const remaining = Math.max(0, Math.ceil((expectedEndTime - Date.now()) / 1000));
        setSecondsRemaining(remaining);
        
        if (remaining === 0) {
          setIsRunning(false);
          setIsRinging(true);
          playAlarm(settings.alarmSound, settings.volume);
          addHistoryEntry(selectedDuration, 'completed');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, expectedEndTime, settings, selectedDuration]);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center bg-[#03030f]">
        <div className="flex flex-col items-center space-y-4">
          <Moon className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Loading PowerNap...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center items-center py-0 sm:py-8 bg-[#03030f]/60">
      {/* Smartphone View Shell */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[820px] sm:max-h-[850px] sm:rounded-[40px] flex flex-col relative overflow-hidden glass-panel border border-slate-800/80 shadow-2xl shadow-indigo-950/20">
        
        {/* Smartphone top details (status bar mockup on desktop) */}
        <div className="hidden sm:flex justify-between items-center px-8 pt-4 pb-2 text-[11px] text-slate-500 font-semibold select-none z-20">
          <span>12:00</span>
          <div className="w-24 h-4 bg-slate-950 rounded-full border border-slate-800 flex justify-center items-center">
            <div className="w-3 h-3 rounded-full bg-slate-900" />
          </div>
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/30" />
            <span>100%</span>
          </div>
        </div>

        {/* Application Header */}
        <header className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-900/60 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10">
              <Moon className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              PowerNap
            </h1>
          </div>
          {isRunning && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">
                Active
              </span>
            </div>
          )}
        </header>

        {/* Main Component Section */}
        <main className="flex-1 overflow-y-auto p-6 pb-28 scrollbar-thin">
          {currentTab === 'timer' && (
            <div className="space-y-6">
              <TimerCircle
                secondsRemaining={secondsRemaining}
                totalSeconds={totalSeconds}
                isRunning={isRunning}
                isRinging={isRinging}
                onStart={handleStartTimer}
                onPause={handlePauseTimer}
                onStop={handleStopTimer}
              />
              
              {!isRunning && !isRinging && secondsRemaining === totalSeconds && (
                <div className="animate-fade-in">
                  <PresetSelector
                    onSelect={handleSelectPreset}
                    selectedDuration={selectedDuration}
                  />
                </div>
              )}
            </div>
          )}

          {currentTab === 'history' && (
            <HistorySection
              history={history}
              onClearHistory={handleClearHistory}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsSection
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </main>

        {/* Sticky Mobile Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 h-20 border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-xl flex justify-around items-center px-4 z-20">
          {/* Timer Tab */}
          <button
            onClick={() => setCurrentTab('timer')}
            className={`flex flex-col items-center justify-center space-y-1 w-16 h-14 rounded-xl transition-all cursor-pointer ${
              currentTab === 'timer'
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className={`w-5.5 h-5.5 ${isRunning ? 'animate-pulse text-indigo-400' : ''}`} />
            <span className="text-[10px] font-bold tracking-wider">タイマー</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => setCurrentTab('history')}
            className={`flex flex-col items-center justify-center space-y-1 w-16 h-14 rounded-xl transition-all cursor-pointer ${
              currentTab === 'history'
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Calendar className="w-5.5 h-5.5" />
              {history.filter(h => h.status === 'completed').length > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-extrabold text-white">
                  {history.filter(h => h.status === 'completed').length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-wider">履歴</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex flex-col items-center justify-center space-y-1 w-16 h-14 rounded-xl transition-all cursor-pointer ${
              currentTab === 'settings'
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-5.5 h-5.5" />
            <span className="text-[10px] font-bold tracking-wider">設定</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
