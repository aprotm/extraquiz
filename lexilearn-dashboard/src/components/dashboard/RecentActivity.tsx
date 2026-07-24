import { Card } from '@/components/ui/card';
import { mockRecentActivity } from '@/lib/mock/dashboard';
import { BookOpen, Mic, Medal, CheckCircle } from 'lucide-react';

const iconMap: Record<string, any> = {
  learn: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  speaking: { icon: Mic, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  badge: { icon: Medal, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  review: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
};

export default function RecentActivity() {
  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
        {mockRecentActivity.map((activity) => {
          const style = iconMap[activity.type] || iconMap.learn;
          const Icon = style.icon;

          return (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface ${style.bg} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-surface-elevated`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
              </div>
              
              {/* Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-surface-elevated border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-foreground">{activity.action}</span>
                  <span className={`text-xs font-bold ${style.color}`}>{activity.reward}</span>
                </div>
                <time className="text-xs text-muted-foreground">{activity.time}</time>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
