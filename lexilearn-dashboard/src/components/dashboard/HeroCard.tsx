import { mockUser } from '@/lib/mock/dashboard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flame, Star, Clock, Play } from 'lucide-react';

export default function HeroCard() {
  const progressOffset = 100 - (mockUser.xpToday / 300) * 100; // Assuming 300 XP is daily max

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-surface to-surface-elevated border-border/50 p-6 md:p-8 rounded-3xl group">
      {/* Animated Background Particles effect can be added here with framer-motion */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors duration-1000" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-between">
        <div className="flex-1 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-surface-elevated shadow-xl overflow-hidden bg-surface">
              <img src={mockUser.avatar} alt={mockUser.name} className="w-full h-full object-cover" />
            </div>
            {/* Daily Progress Ring */}
            <svg className="absolute -inset-2 w-28 h-28 -rotate-90 pointer-events-none">
              <circle cx="56" cy="56" r="52" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
              <circle 
                cx="56" 
                cy="56" 
                r="52" 
                fill="none" 
                stroke="url(#progress-gradient)" 
                strokeWidth="4" 
                strokeDasharray="326"
                strokeDashoffset={progressOffset * 3.26}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C5CFF" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">Good evening, {mockUser.name} 👋</h1>
            <p className="text-muted-foreground text-lg max-w-lg">You are on fire! Complete your speaking practice to hit your daily goal.</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 bg-surface-elevated/50 px-4 py-2 rounded-2xl border border-border/50">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-foreground">+{mockUser.xpToday} XP</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-elevated/50 px-4 py-2 rounded-2xl border border-border/50">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-foreground">{mockUser.streak} Days</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-elevated/50 px-4 py-2 rounded-2xl border border-border/50">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-foreground">{mockUser.studyTimeTodayMins}m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-full lg:w-auto flex flex-col justify-center gap-4">
          <Button size="lg" className="w-full lg:w-64 h-14 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 group-hover:scale-105 transition-all">
            Continue Learning
            <Play className="w-5 h-5 ml-2 fill-current" />
          </Button>
          <Button variant="outline" size="lg" className="w-full lg:w-64 h-14 rounded-2xl text-lg font-bold border-border bg-surface-elevated/30 hover:bg-surface-elevated">
            Review Mistakes
          </Button>
        </div>
      </div>
    </Card>
  );
}
