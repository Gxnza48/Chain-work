import { AppShell } from "@/components/layout/AppShell";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { NotificationsCard } from "@/components/settings/NotificationsCard";
import { IntegrationsCard } from "@/components/settings/IntegrationsCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { AppearanceControls } from "@/components/ui/appearance";

export default function Settings() {
  const { signOut } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === "#integrations")
      document.getElementById("integrations")?.scrollIntoView();
  }, [hash]);

  async function handleLogout() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-10 flex flex-col gap-8">
        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {t("Settings")}
          </h1>
          <p className="text-sm text-fg-muted">
            {t("Manage your profile and account.")}
          </p>
        </header>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
            {t("Profile")}
          </h2>
          <ProfileCard />
        </section>

        <section>
          <NotificationsCard />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>{t("Appearance")}</CardTitle>
              <CardDescription>
                {t("Tune the palette and contrast for your workspace.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceControls />
            </CardContent>
          </Card>
        </section>

        <section id="integrations" className="scroll-mt-20">
          <IntegrationsCard />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>{t("Account")}</CardTitle>
              <CardDescription>
                {t("Signed in as your ChainWork account.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="danger" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                {t("Sign out")}
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
