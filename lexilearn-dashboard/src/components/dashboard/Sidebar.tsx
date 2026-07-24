"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Layers, Mic, MessageSquare, Dna, Medal, Wallet, Store, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vocabulary', href: '/dashboard/vocabulary', icon: BookOpen },
  { name: 'Flashcards', href: '/dashboard/flashcards', icon: Layers },
  { name: 'Speaking', href: '/dashboard/speaking', icon: Mic },
  { name: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'DNA Analysis', href: '/dashboard/dna', icon: Dna },
  { name: 'Badges', href: '/dashboard/badges', icon: Medal },
  { name: 'LexiCredit', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Marketplace', href: '/dashboard/marketplace', icon: Store },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-border bg-surface/50 backdrop-blur-xl h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">LexiLearn</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link key={item.name} href={item.href} className="relative block">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(124,92,255,0.5)]")} />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </div>
  );
}
