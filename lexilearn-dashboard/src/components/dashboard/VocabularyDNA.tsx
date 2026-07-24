"use client";

import { Card } from '@/components/ui/card';
import { mockVocabDNA } from '@/lib/mock/dashboard';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

export default function VocabularyDNA() {
  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-1">Vocabulary DNA</h3>
      <p className="text-sm text-muted-foreground mb-4">Topic distribution</p>
      
      <div className="flex-1 min-h-[250px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockVocabDNA}>
            <PolarGrid stroke="#1E293B" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="User"
              dataKey="A"
              stroke="#22D3EE"
              strokeWidth={2}
              fill="#22D3EE"
              fillOpacity={0.3}
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
