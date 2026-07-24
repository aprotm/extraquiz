"use client";

import { Card } from '@/components/ui/card';
import { mockVocabAnalytics } from '@/lib/mock/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function VocabularyChart() {
  const data = [
    { name: 'New', value: mockVocabAnalytics.new, color: '#3B82F6' },
    { name: 'Learning', value: mockVocabAnalytics.learning, color: '#F59E0B' },
    { name: 'Passive', value: mockVocabAnalytics.passive, color: '#8B5CF6' },
    { name: 'Active', value: mockVocabAnalytics.active, color: '#10B981' },
    { name: 'Mastered', value: mockVocabAnalytics.mastered, color: '#EC4899' },
  ];

  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-1">Vocabulary Stats</h3>
      <p className="text-sm text-muted-foreground mb-6">Total: {mockVocabAnalytics.total} words</p>
      
      <div className="flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#18233E', borderColor: '#1E293B', borderRadius: '12px' }}
              itemStyle={{ color: '#F8FAFC' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Custom center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
          <span className="text-3xl font-black text-foreground">{mockVocabAnalytics.total}</span>
          <span className="text-xs text-muted-foreground font-semibold">Words</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex-1 flex justify-between">
              <span className="text-xs text-muted-foreground font-medium">{item.name}</span>
              <span className="text-xs font-bold text-foreground">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
