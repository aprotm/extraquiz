import { Bell, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUser } from '@/lib/mock/dashboard';

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search vocabulary, decks, or settings..." 
            className="w-full bg-surface-elevated/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-4">
        <button className="relative p-2 rounded-full hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border/50">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{mockUser.name}</p>
            <p className="text-xs text-muted-foreground">Level 12 • {mockUser.lexiCredit.level}</p>
          </div>
          <Avatar className="w-9 h-9 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
            <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
