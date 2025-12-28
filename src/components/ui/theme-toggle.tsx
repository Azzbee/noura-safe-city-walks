import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-lg bg-secondary/50 border border-border/50 
                 flex items-center justify-center overflow-hidden
                 hover:bg-secondary hover:border-primary/30 hover:shadow-glow-sm
                 transition-all duration-300 ease-out group"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Sun icon */}
      <Sun 
        className={`absolute h-5 w-5 text-primary transition-all duration-500 ease-out
          ${theme === 'dark' 
            ? 'rotate-90 scale-0 opacity-0' 
            : 'rotate-0 scale-100 opacity-100'
          }`}
      />
      
      {/* Moon icon */}
      <Moon 
        className={`absolute h-5 w-5 text-primary transition-all duration-500 ease-out
          ${theme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
          }`}
      />
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 
                      bg-gradient-to-br from-primary/10 to-transparent 
                      transition-opacity duration-300" />
    </button>
  );
}
