import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';
import { siteUrl } from '@/lib/site-url';
import { isValidEmail } from '@/lib/utils';

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  function validate() {
    const e: { email?: string; password?: string } = {};
    if (!isValidEmail(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Required';
    return e;
  }

  const liveErrors = validate();
  const formValid = Object.keys(liveErrors).length === 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error('Sign in failed', { description: error.message });
      return;
    }
    toast.success('Welcome back');
    navigate(fromState && fromState !== '/auth' ? fromState : '/dashboard', { replace: true });
  }

  async function onReset() {
    if (!isValidEmail(email)) {
      setTouched((t) => ({ ...t, email: true }));
      setErrors({ ...errors, email: 'Enter your email above first' });
      return;
    }
    setResetSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth?mode=reset`,
    });
    setResetSending(false);
    if (error) {
      toast.error('Could not send reset email', { description: error.message });
    } else {
      toast.success('Reset link sent', { description: `Check ${email}.` });
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => {
            setTouched((t) => ({ ...t, email: true }));
            setErrors(validate());
          }}
          error={touched.email && Boolean(errors.email)}
          placeholder="ada@example.com"
        />
        {touched.email && errors.email ? (
          <p className="text-xs font-semibold text-accent-rose">{errors.email}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <button
            type="button"
            onClick={onReset}
            disabled={resetSending}
            className="text-xs font-bold text-accent-blue hover:underline disabled:opacity-50"
          >
            {resetSending ? 'Sending…' : 'Forgot password?'}
          </button>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: true }));
              setErrors(validate());
            }}
            error={touched.password && Boolean(errors.password)}
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted hover:bg-surface hover:text-fg"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {touched.password && errors.password ? (
          <p className="text-xs font-semibold text-accent-rose">{errors.password}</p>
        ) : null}
      </div>

      <Button type="submit" size="lg" block disabled={!formValid || loading}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {loading ? 'Signing you in…' : 'Sign in'}
      </Button>
    </form>
  );
}
