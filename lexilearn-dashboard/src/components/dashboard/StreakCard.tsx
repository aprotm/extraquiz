import { Card } from '@/components/ui/card';
import { mockUser } from '@/lib/mock/dashboard';
import { Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function StreakCard() {
  const nextBadgeTarget = 30;
  const progressPercent = (mockUser.streak / nextBadgeTarget) * 100;

  return (
    <Card className="bg-gradient-to-br from-[#1A1133] to-[#2E161C] border-orange-500/20 p-6 rounded-3xl relative overflow-hidden group h-full flex flex-col justify-between">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-orange-500/30 transition-colors duration-700" />
      
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div>
          <h3 className="text-sm font-bold text-orange-200 uppercase tracking-wider mb-1">Current Streak</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              {mockUser.streak}
            </span>
            <span className="text-lg font-bold text-orange-200/70">Days</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center relative">
          <Flame className="w-8 h-8 text-orange-500 relative z-10 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
          <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-2xl animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
          <p className="text-xs text-muted-foreground mb-0.5">Best Streak</p>
          <p className="text-lg font-bold text-foreground">{mockUser.bestStreak} <span className="text-xs font-normal">days</span></p>
        </div>
        <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
          <p className="text-xs text-muted-foreground mb-0.5">Total Days</p>
          <p className="text-lg font-bold text-foreground">{mockUser.totalStreak} <span className="text-xs font-normal">days</span></p>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between text-xs font-semibold text-orange-200/70 mb-2">
          <span>Next badge: Inferno</span>
          <span>{mockUser.streak} / {nextBadgeTarget} days</span>
        </div>
        <Progress value={progressPercent} className="h-2.5 bg-black/40" />
      </div>
    </Card>
  );
}
