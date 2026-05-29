import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface Props {
  items: ContextMenuItem[];
  children: React.ReactNode;
  /** Disable the whole menu (no items will show on right-click). */
  disabled?: boolean;
  className?: string;
}

interface Pos {
  x: number;
  y: number;
}

/**
 * Wraps `children` and opens a small floating menu at the cursor on right-click.
 * Closes on outside click, scroll, resize, or Escape. Keeps itself on-screen.
 */
export function ContextMenu({ items, children, disabled, className }: Props) {
  const [pos, setPos] = useState<Pos | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setPos(null), []);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || items.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      setPos({ x: e.clientX, y: e.clientY });
    },
    [disabled, items.length],
  );

  useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onScroll = () => close();
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    // defer so the opening right-click doesn't immediately close it
    const id = window.setTimeout(() => {
      window.addEventListener('mousedown', onClick);
    }, 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('mousedown', onClick);
      window.clearTimeout(id);
    };
  }, [pos, close]);

  // Clamp position into the viewport once the menu is measured.
  useEffect(() => {
    if (!pos || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const pad = 8;
    let { x, y } = pos;
    if (x + rect.width + pad > window.innerWidth) x = window.innerWidth - rect.width - pad;
    if (y + rect.height + pad > window.innerHeight) y = window.innerHeight - rect.height - pad;
    if (x !== pos.x || y !== pos.y) setPos({ x: Math.max(pad, x), y: Math.max(pad, y) });
  }, [pos]);

  return (
    <div onContextMenu={onContextMenu} className={className}>
      {children}
      {pos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ position: 'fixed', top: pos.y, left: pos.x }}
              className="z-[80] min-w-[12rem] animate-fade-rise overflow-hidden rounded-lg border-2 border-fg bg-surface p-1 text-fg shadow-brut"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    close();
                    item.onSelect();
                  }}
                  className={cn(
                    'flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-semibold outline-none transition-colors',
                    'hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40',
                    item.danger ? 'text-accent-rose hover:bg-accent-rose/10' : 'text-fg',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
