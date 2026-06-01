import { Bell, BellRing, Loader2, Share } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useT } from '@/lib/i18n';

export function NotificationsCard() {
  const t = useT();
  const { supported, needsInstall, permission, subscribed, busy, enable, disable } =
    usePushNotifications();

  async function handleEnable() {
    try {
      await enable();
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        toast.error(t('Notifications are blocked'), {
          description: t('Allow notifications for this site in your browser settings.'),
        });
      } else {
        toast.success(t('Notifications enabled'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(t('Could not enable notifications'), {
        description: msg === 'unsupported' ? t("This browser doesn't support push notifications.") : msg,
      });
    }
  }

  async function handleDisable() {
    await disable();
    toast.success(t('Notifications disabled'));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Notifications')}</CardTitle>
        <CardDescription>
          {t('Get a push when a teammate adds a todo, idea or file, joins the chain, or a todo is due.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!supported ? (
          <p className="text-sm text-fg-muted">
            {t("This browser doesn't support push notifications.")}
          </p>
        ) : needsInstall ? (
          <div className="rounded-md border-2 border-dashed border-fg bg-surface-2 p-4 text-sm">
            <p className="font-semibold">{t('Install the app to get notifications on iPhone')}</p>
            <p className="mt-1 flex items-center gap-1.5 text-fg-muted">
              {t('Tap')} <Share className="h-4 w-4" /> {t('then “Add to Home Screen”, open it from there, and come back.')}
            </p>
          </div>
        ) : subscribed ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent-emerald">
              <BellRing className="h-4 w-4" /> {t('Notifications are on for this device.')}
            </span>
            <Button variant="ghost" size="sm" onClick={handleDisable} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('Turn off')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={handleEnable} disabled={busy} className="self-start">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {t('Enable notifications')}
            </Button>
            {permission === 'denied' ? (
              <p className="text-xs text-accent-rose">
                {t('Notifications are blocked. Allow them for this site in your browser settings.')}
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
