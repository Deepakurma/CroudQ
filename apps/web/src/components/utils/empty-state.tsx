import { Frown } from 'lucide-react';

export const EmptyState = ({ text }: { text: string }) => {
  return (
    <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
      <Frown className="text-primary size-8 shrink-0 sm:size-14" />

      <span className="text-md font-medium">{text}</span>
    </div>
  );
};
