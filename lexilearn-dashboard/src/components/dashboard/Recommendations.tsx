import { Card } from '@/components/ui/card';
import { mockRecommendations } from '@/lib/mock/dashboard';
import { BookOpen, Mic, Zap, Briefcase, Play } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  BookOpen, Mic, Zap, Briefcase
};

export default function Recommendations() {
  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">AI Recommendations</h3>
        <p className="text-sm text-muted-foreground">Tailored for you</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockRecommendations.map((rec) => {
          const Icon = iconMap[rec.icon];
          
          return (
            <div key={rec.id} className="p-4 rounded-2xl bg-surface-elevated border border-border/50 hover:border-primary/50 transition-colors group cursor-pointer flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rec.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground">{rec.type}</p>
                </div>
              </div>
              
              <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs font-semibold text-muted-foreground">{rec.time}</span>
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Play className="w-3 h-3 text-primary group-hover:text-white ml-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
