import { useScrollProgress } from '@/hooks/useScrollProgress';

export function ScrollProgress() {
  const ref = useScrollProgress();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 border-b-2 border-fg bg-bg">
      <div
        ref={ref}
        className="h-full w-full bg-accent-blue"
        style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
      />
    </div>
  );
}
