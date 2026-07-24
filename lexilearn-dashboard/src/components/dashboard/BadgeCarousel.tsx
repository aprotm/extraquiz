"use client";

import { Card } from '@/components/ui/card';
import { mockBadges } from '@/lib/mock/dashboard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Zap, Flame, Coins, Target, Dna, BookOpen, Globe } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Zap, Flame, Coins, Target, Dna, BookOpen, Globe
};

export default function BadgeCarousel() {
  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Badge Showcase</h3>
          <p className="text-sm text-muted-foreground">Your achievements</p>
        </div>
      </div>

      <ScrollArea className="w-full pb-4">
        <div className="flex gap-4">
          {mockBadges.map((badge) => {
            const Icon = iconMap[badge.icon];
            
            return (
              <div 
                key={badge.id}
                className={`relative flex-shrink-0 flex flex-col items-center gap-2 p-4 w-28 rounded-2xl border transition-all ${
                  badge.unlocked 
                    ? badge.mythic
                      ? 'bg-surface-elevated border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]'
                      : badge.legendary
                        ? 'bg-surface-elevated border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]'
                        : 'bg-surface-elevated border-border/50 hover:border-primary/50'
                    : 'bg-surface-elevated/50 border-border/20 opacity-40 grayscale'
                }`}
              >
                {badge.mythic && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 [mask-image:linear-gradient(#fff_0_0)] [-webkit-mask-composite:destination-out] mask-composite-exclude p-[1px]" />
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${badge.bg}`}>
                  <Icon className={`w-6 h-6 ${badge.color}`} />
                </div>
                <span className="text-xs font-bold text-center text-foreground">{badge.name}</span>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
