import { Card } from '@/components/ui/card';
import { mockUser } from '@/lib/mock/dashboard';
import { Coins, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';

export default function LexiCreditCard() {
  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">LexiCredit</h3>
          <p className="text-sm text-muted-foreground">Your wallet balance</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Coins className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
        </div>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-black text-foreground">
          {mockUser.lexiCredit.balance.toLocaleString()}
        </span>
        <span className="text-muted-foreground ml-1">LC</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Earned</p>
            <p className="text-sm font-bold text-foreground">+{mockUser.lexiCredit.earnedToday}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="text-sm font-bold text-foreground">-{mockUser.lexiCredit.spent}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-surface-elevated/50 p-3 rounded-2xl border border-border/50">
        <Award className="w-5 h-5 text-gray-300" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Current Level</p>
          <p className="text-sm font-bold text-foreground">{mockUser.lexiCredit.level} Tier</p>
        </div>
      </div>
    </Card>
  );
}
