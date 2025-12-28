import { Menu, Shield, User, LogOut, Settings, Users, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between pointer-events-none">
      {/* Menu button */}
      <Button
        variant="secondary"
        size="icon"
        onClick={onMenuClick}
        className="pointer-events-auto glass shadow-elevated hover:bg-accent/80 
                   hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Logo - Art Deco inspired */}
      <div className="flex items-center gap-3 glass-strong px-5 py-2.5 rounded-full shadow-elevated 
                      pointer-events-auto animate-fade-in-up hover:shadow-glow-sm transition-all duration-300 group">
        <div className="relative group-hover:scale-110 transition-transform duration-300">
          <Shield className="w-6 h-6 text-primary" />
          <div className="absolute inset-0 blur-md bg-primary/30 -z-10 group-hover:blur-lg 
                          group-hover:bg-primary/40 transition-all duration-300" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">Noura</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest hidden sm:block">Paris</span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <ThemeToggle />
        
        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="glass shadow-elevated hover:bg-accent/80 
                         hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-strong shadow-elevated border-border/50 animate-fade-in-scale">
            {user && (
              <>
                <div className="px-3 py-2.5 border-b border-border/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </>
            )}
            <div className="p-1">
              <DropdownMenuItem 
                onClick={() => navigate('/settings')}
                className="rounded-md cursor-pointer gap-3 py-2.5 hover:bg-primary/10 
                           hover:text-primary transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/contacts')}
                className="rounded-md cursor-pointer gap-3 py-2.5 hover:bg-primary/10 
                           hover:text-primary transition-colors"
              >
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Emergency Contacts</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/history')}
                className="rounded-md cursor-pointer gap-3 py-2.5 hover:bg-primary/10 
                           hover:text-primary transition-colors"
              >
                <History className="w-4 h-4 text-muted-foreground" />
                <span>Journey History</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-border/50" />
            <div className="p-1">
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="rounded-md cursor-pointer gap-3 py-2.5 text-danger 
                           focus:text-danger focus:bg-danger/10 hover:bg-danger/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
