import { Card } from '@/components/ui/card';
import { mockWeeklyReport } from '@/lib/mock/dashboard';
import { Clock, BookPlus, Zap, Mic, Star } from 'lucide-react';

export default function WeeklyReport() {
  const items = [
    { label: 'Study Time', value: mockWeeklyReport.studyTime, icon: Clock, color: 'text-blue-500' },
    { label: 'New Words', value: mockWeeklyReport.newWords, icon: BookPlus, color: 'text-indigo-500' },
    { label: 'Active Words', value: mockWeeklyReport.activeWords, icon: Zap, color: 'text-green-500' },
    { label: 'Speaking', value: mockWeeklyReport.speakingTime, icon: Mic, color: 'text-purple-500' },
    { label: 'XP Earned', value: mockWeeklyReport.xp, icon: Star, color: 'text-yellow-500' },
  ];

  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">Weekly Report</h3>
        <p className="text-sm text-muted-foreground">Last 7 days summary</p>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated border border-border/30">
            <div className="flex items-center gap-3">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
