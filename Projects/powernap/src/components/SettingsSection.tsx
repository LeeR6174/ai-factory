import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Sliders, Settings } from 'lucide-react';
import { previewSound } from '../utils/audio';

interface SettingsData {
  id: string;
  presetDuration: number;
  alarmSound: string;
  volume: number;
}

interface SettingsSectionProps {
  settings: SettingsData;
  onUpdateSettings: (newSettings: Partial<SettingsData>) => Promise<boolean>;
}

const SOUNDS = [
  { id: 'chime', name: '穏やかなチャイム', desc: '徐々に目覚めを促す澄んだ音' },
  { id: 'beep', name: 'デジタルビープ', desc: 'すっきりと起きるクラシックな電子音' },
  { id: 'synth', name: 'アンビエント・シンセ', desc: 'リラックスできる温かいコード進行' },
  { id: 'pulse', name: 'リズム・パルス', desc: '優しく脈打つような低音アラーム' },
];

export default function SettingsSection({ settings, onUpdateSettings }: SettingsSectionProps) {
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Trigger settings update and handle UI save indicators
  const handleChange = async (updatedFields: Partial<SettingsData>) => {
    setSaveStatus('saving');
    const success = await onUpdateSettings(updatedFields);
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handlePreview = async (soundId: string) => {
    setIsPlayingPreview(soundId);
    await previewSound(soundId, settings.volume);
    setTimeout(() => {
      setIsPlayingPreview(null);
    }, 1500); // match preview length
  };

  const getVolumeIcon = () => {
    if (settings.volume === 0) return <VolumeX className="w-5 h-5 text-slate-500" />;
    return <Volume2 className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center text-indigo-200">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-medium tracking-wide">タイマー設定</h2>
        </div>
        
        {/* Save State Indicator */}
        <div className="text-xs">
          {saveStatus === 'saving' && <span className="text-indigo-400 animate-pulse">保存中...</span>}
          {saveStatus === 'saved' && <span className="text-emerald-400">✓ 設定を保存しました</span>}
          {saveStatus === 'error' && <span className="text-rose-400">⚠ 保存に失敗しました</span>}
        </div>
      </div>

      {/* Volume Setting */}
      <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 space-y-3 backdrop-blur-md">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-indigo-200 flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>アラーム音量</span>
          </span>
          <span className="text-white font-mono">{Math.round(settings.volume * 100)}%</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleChange({ volume: settings.volume > 0 ? 0 : 0.5 })}
            className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 transition-all cursor-pointer"
          >
            {getVolumeIcon()}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={(e) => handleChange({ volume: parseFloat(e.target.value) })}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
        </div>
      </div>

      {/* Alarm Sound Selection */}
      <div className="space-y-3">
        <span className="text-sm font-semibold text-indigo-200 block px-1">アラーム音の選択</span>
        
        <div className="space-y-2.5">
          {SOUNDS.map((sound) => {
            const isSelected = settings.alarmSound === sound.id;
            return (
              <div
                key={sound.id}
                onClick={() => isSelected ? null : handleChange({ alarmSound: sound.id })}
                className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-300 ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                    : 'border-slate-800 bg-slate-950/10 hover:border-slate-700/50 hover:bg-slate-900/30 cursor-pointer'
                }`}
              >
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-bold text-white">
                    {sound.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {sound.desc}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent select action
                    handlePreview(sound.id);
                  }}
                  disabled={isPlayingPreview !== null}
                  className={`flex items-center justify-center p-2 rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all border cursor-pointer ${
                    isPlayingPreview === sound.id
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 animate-pulse'
                      : 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300 hover:bg-indigo-900/40 hover:text-white'
                  }`}
                  title="音声をテスト"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
