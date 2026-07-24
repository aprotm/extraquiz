"use client";

import { Card } from '@/components/ui/card';
import { mockHeatmapData } from '@/lib/mock/dashboard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function Heatmap() {
  // Group data by weeks for GitHub-style layout (columns = weeks, rows = days of week)
  // Assuming the first item is the oldest date
  const weeks: typeof mockHeatmapData[] = [];
  
  for (let i = 0; i < mockHeatmapData.length; i += 7) {
    weeks.push(mockHeatmapData.slice(i, i + 7));
  }

  const getColorClass = (value: number) => {
    switch (value) {
      case 0: return 'bg-surface-elevated border-border/20';
      case 1: return 'bg-primary/20 border-primary/20';
      case 2: return 'bg-primary/50 border-primary/40';
      case 3: return 'bg-primary/80 border-primary/60';
      case 4: return 'bg-primary border-primary';
      default: return 'bg-surface-elevated border-border/20';
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Simplified month labels for layout
  const monthLabels = [months[6], months[7], months[8], months[9], months[10], months[11], months[0], months[1], months[2], months[3], months[4], months[5], months[6]];

  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Learning Heatmap</h3>
          <p className="text-sm text-muted-foreground">Your 365-day consistency</p>
        </div>
      </div>

      <ScrollArea className="w-full pb-4">
        <div className="min-w-[700px]">
          <div className="flex text-xs text-muted-foreground font-semibold mb-2 ml-8 justify-between pr-4">
            {monthLabels.map((month, i) => (
              <span key={i}>{month}</span>
            ))}
          </div>
          
          <div className="flex gap-2">
            <div className="flex flex-col gap-[6px] text-[10px] text-muted-foreground font-semibold mt-1">
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
              <span>Sun</span>
            </div>
            
            <div className="flex gap-1.5 flex-1">
              <TooltipProvider>
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-1.5">
                    {week.map((day, dIndex) => (
                      <Tooltip key={`${wIndex}-${dIndex}`}>
                        <TooltipTrigger>
                          <div 
                            className={`w-3 h-3 rounded-sm border ${getColorClass(day.value)} hover:ring-2 hover:ring-foreground/20 hover:scale-125 transition-all cursor-pointer`}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-surface-elevated border-border text-foreground">
                          <p className="font-bold mb-1">{new Date(day.date).toDateString()}</p>
                          {day.value > 0 ? (
                            <>
                              <p className="text-xs text-muted-foreground">{day.studyMinutes} minutes of study</p>
                              <p className="text-xs text-primary font-bold">+{day.xp} XP earned</p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">No activity</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
