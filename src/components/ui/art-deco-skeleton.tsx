import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ArtDecoSkeletonProps {
  className?: string;
  variant?: "default" | "card" | "text" | "avatar" | "button" | "route";
}

export function ArtDecoSkeleton({ 
  className, 
  variant = "default" 
}: ArtDecoSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        // Art Deco geometric pattern overlay
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent",
        "before:animate-shimmer before:bg-[length:200%_100%]",
        // Subtle border with glow
        "border border-border/30",
        // Corner accents
        "after:absolute after:top-0 after:left-0 after:w-3 after:h-3 after:border-l after:border-t after:border-primary/20",
        className
      )}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "glass rounded-xl p-6 space-y-4 relative overflow-hidden",
      "before:absolute before:top-0 before:right-0 before:w-16 before:h-16",
      "before:border-r before:border-t before:border-primary/10",
      className
    )}>
      {/* Art Deco corner decoration */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/20 rounded-tl-lg" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/20 rounded-br-lg" />
      
      <div className="flex items-start gap-4">
        <ArtDecoSkeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <ArtDecoSkeleton className="h-4 w-3/4" />
          <ArtDecoSkeleton className="h-3 w-1/2" />
        </div>
      </div>
      <ArtDecoSkeleton className="h-20" />
      <div className="flex gap-2">
        <ArtDecoSkeleton className="h-8 w-20 rounded-full" />
        <ArtDecoSkeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ArtDecoSkeleton 
          key={i} 
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )} 
        />
      ))}
    </div>
  );
}

export function AvatarSkeleton({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };
  
  return (
    <ArtDecoSkeleton className={cn(
      sizes[size],
      "rounded-full",
      // Decorative ring
      "ring-2 ring-primary/10 ring-offset-2 ring-offset-background",
      className
    )} />
  );
}

export function ButtonSkeleton({ className }: { className?: string }) {
  return (
    <ArtDecoSkeleton className={cn(
      "h-10 w-24 rounded-lg",
      className
    )} />
  );
}

export function RouteSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 p-4 glass rounded-xl", className)}>
      {/* Route header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArtDecoSkeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <ArtDecoSkeleton className="h-4 w-24" />
            <ArtDecoSkeleton className="h-3 w-16" />
          </div>
        </div>
        <ArtDecoSkeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {/* Route line visualization */}
      <div className="relative h-2 rounded-full overflow-hidden bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 rounded-full"
          animate={{ x: ["0%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* Route stats */}
      <div className="flex gap-4">
        <ArtDecoSkeleton className="h-8 flex-1 rounded-lg" />
        <ArtDecoSkeleton className="h-8 flex-1 rounded-lg" />
        <ArtDecoSkeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "relative w-full h-full min-h-[300px] bg-surface-elevated rounded-xl overflow-hidden",
      className
    )}>
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Animated location pulse */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-24 h-24 rounded-full bg-primary/20 blur-xl" />
      </motion.div>
      
      {/* Center marker */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <ArtDecoSkeleton className="w-6 h-6 rounded-full" />
      </div>
      
      {/* Art Deco corners */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary/20" />
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary/20" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-primary/20" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-primary/20" />
      
      {/* Loading text */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm font-display text-muted-foreground tracking-wider"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        LOADING MAP...
      </motion.div>
    </div>
  );
}

export function JourneyHistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <CardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}
