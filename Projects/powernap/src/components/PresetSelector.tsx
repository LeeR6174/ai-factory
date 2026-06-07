import React from 'react';
import { Clock } from 'lucide-react';

interface Preset {
  duration: number;
  label: string;
  description: string;
  color: string;
}

const PRESETS: Preset[] = [
  {
    duration: 15,
    label: 'ナノ・ナップ',
    description: '眠気解消に最適。睡眠慣性が起きません。',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50',
  },
  {
    duration: 20,
    label: 'パワー・ナップ',
    description: '脳の疲労回復と注意力アップに最も推奨されます。',
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 hover:border-violet-500/50',
  },
  {
    duration: 30,
    label: 'リカバリー・ナップ',
    description: 'しっかり休息。目覚めた時に少しだるさがある場合も。',
    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 hover:border-blue-500/50',
  },
  {
    duration: 45,
    label: 'レメディ・ナップ',
    description: '深い睡眠を含み、体力を大きく回復します。',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50',
  },
  {
    duration: 60,
    label: 'フルサイクル・ナップ',
    description: 'ほぼ1サイクルの睡眠。脳機能と記憶力を向上。',
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 hover:border-rose-500/50',
  },
];

interface PresetSelectorProps {
  onSelect: (duration: number) => void;
  selectedDuration: number;
}

export default function PresetSelector({ onSelect, selectedDuration }: PresetSelectorProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-2 text-indigo-200">
        <Clock className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-medium tracking-wide">昼寝の長さを選択</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRESETS.map((preset) => {
          const isSelected = selectedDuration === preset.duration;
          return (
            <button
              key={preset.duration}
              onClick={() => onSelect(preset.duration)}
              className={`relative flex flex-col p-4 rounded-2xl border bg-gradient-to-br text-left transition-all duration-300 transform active:scale-98 cursor-pointer ${
                isSelected
                  ? 'border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                  : preset.color + ' bg-slate-950/20'
              }`}
            >
              <div className="flex justify-between items-baseline w-full">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {preset.duration} <span className="text-sm font-normal text-indigo-300">分</span>
                </span>
                {isSelected && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 animate-pulse">
                    選択中
                  </span>
                )}
              </div>
              <span className="mt-1 text-sm font-semibold text-indigo-200">
                {preset.label}
              </span>
              <span className="mt-1 text-xs text-indigo-300/70 leading-relaxed">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
