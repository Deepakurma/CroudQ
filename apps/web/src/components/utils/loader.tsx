import { WandSparkles } from 'lucide-react';

export const Loader = () => {
  return (
    <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
      <div className="relative h-14 w-14">
        {/* Rotating border */}
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500 border-r-fuchsia-500" />

        {/* Center */}
        <div className="bg-card absolute inset-1 flex items-center justify-center rounded-full">
          <WandSparkles className="text-primary h-6 w-6 animate-pulse" />
        </div>
      </div>

      <span className="from-muted-foreground via-primary to-muted-foreground animate-[shimmer_2s_linear_infinite] bg-gradient-to-r bg-[length:200%_100%] bg-clip-text text-sm font-medium text-transparent">
        Adding Magic...
      </span>
    </div>
  );
};
