// Generates the PWA / apple-touch icons from the brand mark.
// Run once (or after changing the source): `npm run icons`.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const SRC = resolve(root, 'public/brand-mark.png');
const OUT = resolve(root, 'public/icons');
const BG = { r: 10, g: 10, b: 10, alpha: 1 }; // #0A0A0A

async function iconOnBg(size, pad) {
  const inner = Math.round(size * (1 - pad));
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await (await iconOnBg(192, 0.12)).toFile(resolve(OUT, 'pwa-192.png'));
  await (await iconOnBg(512, 0.12)).toFile(resolve(OUT, 'pwa-512.png'));
  // Maskable needs a generous safe-zone so the logo survives circular masks.
  await (await iconOnBg(512, 0.3)).toFile(resolve(OUT, 'maskable-512.png'));
  // Apple touch icon: opaque background, no transparency.
  await (await iconOnBg(180, 0.14)).toFile(resolve(OUT, 'apple-touch-180.png'));
  // eslint-disable-next-line no-console
  console.log('PWA icons written to public/icons/');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
