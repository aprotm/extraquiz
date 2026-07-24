import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, ArrowRight } from 'lucide-react';

export default function AICoachCard() {
  return (
    <Card className="bg-gradient-to-br from-surface to-surface-elevated border-primary/30 p-6 rounded-3xl relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          AI Coach Insights
          <Sparkles className="w-4 h-4 text-accent" />
        </h3>
      </div>

      <p className="text-muted-foreground leading-relaxed mb-6">
        <strong className="text-foreground">Your Business Vocabulary is improving rapidly</strong>, but <span className="text-accent">Technology vocabulary</span> has been forgotten frequently. Review 18 Tech words today to strengthen your memory retention.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 rounded-full bg-surface-elevated overflow-hidden border border-border">
                <div className="h-full bg-accent w-[72%] rounded-full" />
              </div>
              <span className="text-sm font-bold text-accent">72%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Est. Time</p>
            <p className="text-sm font-bold text-foreground">12 mins</p>
          </div>
        </div>

        <Button className="rounded-xl bg-white/10 hover:bg-white/20 text-foreground border border-white/10">
          Start Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}
