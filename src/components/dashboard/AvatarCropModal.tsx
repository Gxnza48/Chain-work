import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Move, ZoomIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

const VIEW = 264; // square preview size in px
const OUT = 512; // exported avatar size in px

interface Props {
  file: File | null;
  busy?: boolean;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}

export function AvatarCropModal({ file, busy, onCancel, onCropped }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Load the picked file into an object URL and reset the transform.
  useEffect(() => {
    if (!file) {
      setSrc(null);
      setNat(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = nat ? Math.max(VIEW / nat.w, VIEW / nat.h) : 1;
  const eff = baseScale * scale;

  const clampOffset = useCallback(
    (x: number, y: number, s: number) => {
      if (!nat) return { x: 0, y: 0 };
      const e = baseScale * s;
      const maxX = Math.max(0, (nat.w * e - VIEW) / 2);
      const maxY = Math.max(0, (nat.h * e - VIEW) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [nat, baseScale],
  );

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const nx = drag.current.ox + (e.clientX - drag.current.x);
    const ny = drag.current.oy + (e.clientY - drag.current.y);
    setOffset(clampOffset(nx, ny, scale));
  }
  function onPointerUp() {
    drag.current = null;
  }

  function onZoom(next: number) {
    setScale(next);
    setOffset((o) => clampOffset(o.x, o.y, next));
  }

  function confirm() {
    const img = imgRef.current;
    if (!img || !nat) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sf = OUT / VIEW;
    const drawW = nat.w * eff * sf;
    const drawH = nat.h * eff * sf;
    const dx = OUT / 2 + offset.x * sf - drawW / 2;
    const dy = OUT / 2 + offset.y * sf - drawH / 2;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, drawW, drawH);
    canvas.toBlob(
      (blob) => {
        if (blob) onCropped(blob);
      },
      'image/jpeg',
      0.9,
    );
  }

  return (
    <Dialog
      open={Boolean(file)}
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
          <DialogDescription>Drag to reposition and zoom to frame it just right.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div
            className="relative cursor-grab touch-none overflow-hidden rounded-full border-2 border-fg bg-surface-2 shadow-brut active:cursor-grabbing"
            style={{ width: VIEW, height: VIEW }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {src ? (
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  setNat({ w: el.naturalWidth, h: el.naturalHeight });
                }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: nat ? nat.w * baseScale : VIEW,
                  height: nat ? nat.h * baseScale : VIEW,
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  userSelect: 'none',
                  maxWidth: 'none',
                }}
              />
            ) : null}
            {/* grid guides */}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-fg/20" />
          </div>

          <div className="flex w-full items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-fg-muted" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => onZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="h-2 w-full cursor-pointer appearance-none rounded-full border-2 border-fg bg-surface-2 accent-accent-blue"
            />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-fg-muted">
            <Move className="h-3.5 w-3.5" /> Drag the image to reposition
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={busy || !nat}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
