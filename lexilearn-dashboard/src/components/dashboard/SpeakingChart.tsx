"use client";

import { Card } from '@/components/ui/card';
import { mockSpeakingAnalytics } from '@/lib/mock/dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SpeakingChart() {
  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Speaking Analytics</h3>
          <p className="text-sm text-muted-foreground">Performance over last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-foreground">38<span className="text-base text-muted-foreground font-semibold">m</span></p>
          <p className="text-xs text-muted-foreground">Today's speaking time</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockSpeakingAnalytics} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#94A3B8" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#94A3B8" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              domain={[50, 100]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18233E', borderColor: '#1E293B', borderRadius: '12px', color: '#F8FAFC' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="fluency" 
              stroke="#7C5CFF" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#7C5CFF', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#7C5CFF', stroke: '#18233E', strokeWidth: 2 }}
              animationDuration={2000}
            />
            <Line 
              type="monotone" 
              dataKey="pronunciation" 
              stroke="#34D399" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#34D399', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#34D399', stroke: '#18233E', strokeWidth: 2 }}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-muted-foreground">Fluency</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs font-semibold text-muted-foreground">Pronunciation</span>
        </div>
      </div>
    </Card>
  );
}
