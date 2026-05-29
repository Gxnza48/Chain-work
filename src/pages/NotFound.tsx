import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg text-fg dot-bg p-6">
      <div className="text-center">
        <Logo className="justify-center" />
        <h1 className="mt-8 font-display text-7xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-lg text-fg-muted">That page doesn't exist.</p>
        <Button asChild className="mt-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
