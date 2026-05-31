import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { PasswordStrength } from './PasswordStrength';
import { supabase } from '@/lib/supabase';
import { siteUrl } from '@/lib/site-url';
import { isValidEmail, isValidUsername, passwordStrength } from '@/lib/utils';

interface Fields {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
}

interface Errors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export function RegisterForm() {
  const [fields, setFields] = useState<Fields>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<keyof Fields, boolean>>({
    fullName: false,
    username: false,
    email: false,
    password: false,
    confirm: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function validate(next: Fields = fields): Errors {
    const e: Errors = {};
    if (!next.fullName.trim()) e.fullName = 'Required';
    if (!isValidUsername(next.username))
      e.username = 'Lowercase letters/digits, 3-24 chars, no spaces';
    if (!isValidEmail(next.email)) e.email = 'Enter a valid email';
    if (passwordStrength(next.password).score < 2)
      e.password = 'Password is too weak (≥ 8 chars, mix of cases/digits)';
    if (next.confirm !== next.password) e.confirm = 'Passwords do not match';
    return e;
  }

  function onBlur(key: keyof Fields) {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate());
  }

  const liveErrors = validate();
  const formValid = Object.keys(liveErrors).length === 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ fullName: true, username: true, email: true, password: true, confirm: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: fields.email,
      password: fields.password,
      options: {
        emailRedirectTo: `${siteUrl()}/auth?confirmed=1`,
        data: {
          username: fields.username.toLowerCase(),
          display_name: fields.fullName.trim(),
        },
      },
    });
    setLoading(false);

    if (error) {
      const msg = /username/i.test(error.message)
        ? 'That username is taken'
        : error.message;
      toast.error('Could not sign you up', { description: msg });
      return;
    }
    toast.success('Confirm your email', {
      description: `We sent a link to ${fields.email}.`,
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Full name" htmlFor="fullName" error={touched.fullName ? errors.fullName : undefined}>
        <Input
          id="fullName"
          autoComplete="name"
          value={fields.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          onBlur={() => onBlur('fullName')}
          error={touched.fullName && Boolean(errors.fullName)}
          placeholder="Ada Lovelace"
        />
      </Field>

      <Field label="Username" htmlFor="username" error={touched.username ? errors.username : undefined}>
        <Input
          id="username"
          autoComplete="username"
          value={fields.username}
          onChange={(e) => update('username', e.target.value.toLowerCase().replace(/\s+/g, ''))}
          onBlur={() => onBlur('username')}
          error={touched.username && Boolean(errors.username)}
          placeholder="ada"
        />
      </Field>

      <Field label="Email" htmlFor="email" error={touched.email ? errors.email : undefined}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={(e) => update('email', e.target.value)}
          onBlur={() => onBlur('email')}
          error={touched.email && Boolean(errors.email)}
          placeholder="ada@example.com"
        />
      </Field>

      <Field label="Password" htmlFor="password" error={touched.password ? errors.password : undefined}>
        <div className="relative">
          <Input
            id="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            value={fields.password}
            onChange={(e) => update('password', e.target.value)}
            onBlur={() => onBlur('password')}
            error={touched.password && Boolean(errors.password)}
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted hover:bg-surface hover:text-fg"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrength password={fields.password} />
      </Field>

      <Field label="Confirm password" htmlFor="confirm" error={touched.confirm ? errors.confirm : undefined}>
        <div className="relative">
          <Input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            value={fields.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            onBlur={() => onBlur('confirm')}
            error={touched.confirm && Boolean(errors.confirm)}
            placeholder="••••••••"
            className="pr-11"
          />
          <button
            type="button"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted hover:bg-surface hover:text-fg"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" size="lg" block disabled={!formValid || loading}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {loading ? 'Creating your account…' : 'Create account'}
      </Button>
    </form>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs font-semibold text-accent-rose">{error}</p> : null}
    </div>
  );
}
