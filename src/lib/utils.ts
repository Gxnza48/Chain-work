import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLangStore } from '@/store/lang';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const CHAIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/l confusion

export function generateChainCode(length = 8): string {
  let out = '';
  const len = CHAIN_CODE_ALPHABET.length;
  const buf = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
    for (let i = 0; i < length; i++) {
      out += CHAIN_CODE_ALPHABET[buf[i]! % len];
    }
  } else {
    for (let i = 0; i < length; i++) {
      out += CHAIN_CODE_ALPHABET[Math.floor(Math.random() * len)];
    }
  }
  return out;
}

export function relativeTime(iso: string | null | undefined): string {
  const es = useLangStore.getState().lang === 'es';
  if (!iso) return es ? 'nunca' : 'never';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return es ? 'recién' : 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return es ? `hace ${diffMin}m` : `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return es ? `hace ${diffHr}h` : `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return es ? `hace ${diffDay}d` : `${diffDay}d ago`;
  const diffWk = Math.round(diffDay / 7);
  if (diffWk < 5) return es ? `hace ${diffWk}sem` : `${diffWk}w ago`;
  return new Date(iso).toLocaleDateString(es ? 'es' : undefined);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: 'muted' | 'rose' | 'amber' | 'blue' | 'emerald';
}

export function passwordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: 'Empty', color: 'muted' };
  const classes =
    Number(/[a-z]/.test(pw)) +
    Number(/[A-Z]/.test(pw)) +
    Number(/[0-9]/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));
  if (pw.length < 8 || classes <= 1) return { score: 1, label: 'Weak', color: 'rose' };
  if (classes === 2) return { score: 2, label: 'Fair', color: 'amber' };
  if (classes === 3) return { score: 3, label: 'Good', color: 'blue' };
  return { score: 4, label: 'Strong', color: 'emerald' };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(s: string): boolean {
  return /^[a-z0-9]{3,24}$/.test(s);
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
  }
  return Promise.resolve(false);
}

const REPO_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org', 'www.github.com', 'www.gitlab.com']);
const VIDEO_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'www.vimeo.com']);

export function classifyUrl(url: string): 'repo' | 'video' | 'link' {
  try {
    const u = new URL(url);
    if (REPO_HOSTS.has(u.hostname)) return 'repo';
    if (VIDEO_HOSTS.has(u.hostname)) return 'video';
    return 'link';
  } catch {
    return 'link';
  }
}

export function safeFaviconUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

export function youTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.endsWith('vimeo.com')) {
      const id = u.pathname.replace(/^\//, '');
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function bytesToMB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const DOC_MAX_BYTES = 25 * 1024 * 1024;

/** Rough device classification from the user agent, for the presence indicator. */
export function deviceType(): 'mobile' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  return mobile ? 'mobile' : 'desktop';
}

/** Classify an uploaded document file as a 'pdf' or 'html' attachment. */
export function classifyDocFile(file: File): 'pdf' | 'html' | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm')) return 'html';
  return null;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Local midnight (ms) for today — used for due-date comparisons. */
export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export type DueState = 'overdue' | 'today' | 'soon' | 'later';

/**
 * Classify a `YYYY-MM-DD` due date relative to today (local time). `soon` means
 * due within the next two days. Returns null for empty/invalid dates.
 */
export function dueState(due: string | null | undefined): { state: DueState; days: number } | null {
  if (!due) return null;
  const due0 = new Date(`${due.slice(0, 10)}T00:00:00`).getTime();
  if (Number.isNaN(due0)) return null;
  const days = Math.round((due0 - startOfToday()) / 86_400_000);
  const state: DueState = days < 0 ? 'overdue' : days === 0 ? 'today' : days <= 2 ? 'soon' : 'later';
  return { state, days };
}

/** True when the event originates from a text field, so global hotkeys can bail out. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
}

/** Strip HTML down to plain text (used when turning a rich-text idea into a todo). */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
}
