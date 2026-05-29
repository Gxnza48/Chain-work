import { Link, Navigate, useLocation } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface Props {
  children: React.ReactNode;
}

export function AuthGuard({ children }: Props) {
  const { user, loading, emailConfirmed } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-fg-muted">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (!emailConfirmed) {
    return <ConfirmEmailGate email={user.email ?? ''} />;
  }

  return <>{children}</>;
}

function ConfirmEmailGate({ email }: { email: string }) {
  async function resend() {
    if (!email) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      toast.error('Could not resend', { description: error.message });
    } else {
      toast.success('Confirmation email sent', { description: `Check ${email}.` });
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="inline-grid h-12 w-12 place-items-center rounded-lg border-2 border-fg bg-accent-blue text-white shadow-brut-sm">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle>Confirm your email</CardTitle>
          <CardDescription>
            We sent a confirmation link to <span className="font-mono text-fg">{email}</span>. Click the link
            in that email to unlock your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button variant="primary" block onClick={resend}>
            Resend confirmation email
          </Button>
          <Button variant="ghost" asChild block>
            <Link to="/auth">Use a different account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
