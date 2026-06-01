import type { VercelRequest, VercelResponse } from '@vercel/node';

// Zero-dependency health check to isolate function-load failures.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, ts: Date.now() });
}
