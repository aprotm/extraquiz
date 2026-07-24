"use client";

import { Card } from '@/components/ui/card';
import { mockVocabAnalytics } from '@/lib/mock/dashboard';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ActivePassiveCard() {
  const activationRate = Math.round((mockVocabAnalytics.active / (mockVocabAnalytics.passive + mockVocabAnalytics.active)) * 100);

  return (
    <Card className="bg-surface border-border/50 p-6 rounded-3xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground">Activation Rate</h3>
          <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">
            {activationRate}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Active vs Passive vocabulary</p>
      </div>

      <div className="flex items-end gap-4 h-32 mb-6">
        <div className="flex-1 flex flex-col justify-end gap-2 group">
          <div className="text-center">
            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{mockVocabAnalytics.passive}</span>
          </div>
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full bg-surface-elevated rounded-t-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-purple-500/5" />
          </motion.div>
          <div className="text-center mt-2">
            <span className="text-xs font-semibold text-muted-foreground">Passive</span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-end gap-2 group">
          <div className="text-center">
            <span className="text-xs font-bold text-green-400">{mockVocabAnalytics.active}</span>
          </div>
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: '45%' }} // Approximation based on 33% rate + visual balance
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="w-full bg-green-500/20 rounded-t-xl relative overflow-hidden border-t-2 border-green-500"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-green-500/10" />
          </motion.div>
          <div className="text-center mt-2">
            <span className="text-xs font-semibold text-muted-foreground">Active</span>
          </div>
        </div>
      </div>

      <Button className="w-full rounded-xl bg-surface-elevated hover:bg-white/10 text-foreground border border-border/50 transition-colors">
        Activate More
        <ArrowUpRight className="w-4 h-4 ml-2 text-green-400" />
      </Button>
    </Card>
  );
}
