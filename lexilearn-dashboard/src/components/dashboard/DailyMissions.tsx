"use client";

import { Card } from '@/components/ui/card';
import { mockDailyMissions } from '@/lib/mock/dashboard';
import { CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DailyMissions() {
  const completedCount = mockDailyMissions.filter(m => m.completed).length;

  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Daily Missions</h3>
          <p className="text-sm text-muted-foreground">{completedCount} of {mockDailyMissions.length} completed</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {completedCount}/{mockDailyMissions.length}
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {mockDailyMissions.map((mission, index) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              mission.completed 
                ? 'bg-primary/5 border-primary/20 opacity-70' 
                : 'bg-surface-elevated border-border/50 hover:border-primary/50'
            }`}
          >
            {mission.completed ? (
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-semibold ${mission.completed ? 'text-foreground line-through decoration-primary/30' : 'text-foreground'}`}>
                {mission.title}
              </p>
              <p className="text-xs text-primary font-bold mt-1">{mission.reward}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
