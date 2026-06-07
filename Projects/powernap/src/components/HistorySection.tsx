import React from 'react';
import { Trash2, Award, Calendar, Moon, CheckCircle, XCircle } from 'lucide-react';

export interface NapHistoryItem {
  id: string;
  timestamp: number;
  duration: number; // in minutes
  status: 'completed' | 'cancelled';
}

interface HistorySectionProps {
  history: NapHistoryItem[];
  onClearHistory: () => void;
}

export default function HistorySection({ history, onClearHistory }: HistorySectionProps) {
  // Calculations
  const completedNaps = history.filter((item) => item.status === 'completed');
  const totalCompletedMinutes = completedNaps.reduce((acc, item) => acc + item.duration, 0);

  // Formatting date
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${date}日 ${hours}:${minutes}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center space-x-2 text-indigo-300">
            <Award className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wider">合計昼寝回数</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{completedNaps.length}</span>
            <span className="text-xs text-slate-400 ml-1">回</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center space-x-2 text-purple-300">
            <Moon className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-semibold tracking-wider">合計時間</span>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{totalCompletedMinutes}</span>
            <span className="text-xs text-slate-400 ml-1">分</span>
          </div>
        </div>
      </div>

      {/* History List Header */}
      <div className="flex justify-between items-center text-indigo-200">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-medium tracking-wide">履歴ログ</h2>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm('すべての履歴を削除しますか？')) {
                onClearHistory();
              }
            }}
            className="flex items-center space-x-1 py-1 px-3 rounded-lg text-xs font-semibold bg-rose-950/30 text-rose-300 border border-rose-500/20 hover:bg-rose-900/40 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>すべて削除</span>
          </button>
        )}
      </div>

      {/* History Cards */}
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-950/10 border border-dashed border-indigo-500/20 backdrop-blur-sm">
          <Moon className="w-12 h-12 text-indigo-500/30 animate-pulse mb-3" />
          <p className="text-sm font-semibold text-slate-300">履歴がありません</p>
          <p className="text-xs text-slate-500 mt-1">昼寝を完了するとここに記録されます。</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/20 transition-all duration-300"
            >
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-bold text-white">
                  {item.duration}分 の昼寝
                </span>
                <span className="text-xs text-slate-400">
                  {formatDate(item.timestamp)}
                </span>
              </div>

              <div>
                {item.status === 'completed' ? (
                  <span className="flex items-center space-x-1 py-1 px-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>完了</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 py-1 px-2.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>キャンセル</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
