import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/cojeev/breadcrumb";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Folder,
  Lightbulb,
  ListTodo,
  Menu,
  MessageSquare,
  ArrowLeft,
  Plug,
  Users,
} from "lucide-react";
import { ChainLoader } from "@/components/ui/ChainLoader";
import { ChainHeader } from "@/components/chain/ChainHeader";
import { MembersPanel } from "@/components/chain/MembersPanel";
import { ProjectListView } from "@/components/project/ProjectListView";
import { ProjectView } from "@/components/project/ProjectView";
import { TodoList } from "@/components/todos/TodoList";
import { IdeaList } from "@/components/ideas/IdeaList";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Button } from "@/components/ui/Button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/Sheet";
import { useChain } from "@/hooks/useChain";
import { useChatUnread } from "@/hooks/useChatUnread";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  readWorkspaceLocation,
  workspaceSearch,
} from "@/lib/workspace-navigation";

const tabs = [
  { id: "projects", label: "Projects", icon: Folder },
  { id: "todos", label: "All tasks", icon: ListTodo },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "chat", label: "Chat", icon: MessageSquare },
] as const;

export default function ChainPage() {
  const { chainId } = useParams<{ chainId: string }>();
  const { chain, members, myRole, loading, error, refresh } = useChain(chainId);
  const { total: unread, mentions } = useChatUnread(chainId);
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab: activeTab, project: openProject } =
    readWorkspaceLocation(searchParams);
  const [navOpen, setNavOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  function navigate(tab: string, project?: string) {
    setSearchParams(workspaceSearch(tab, project));
    setNavOpen(false);
  }
  if (loading) return <ChainLoader fullscreen label={t("Loading chain…")} />;
  if (error || !chain)
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div role="alert" className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">
            {t("Could not open this chain")}
          </h1>
          <p className="my-4 text-sm text-fg-muted">
            {t("Check your connection and access, then try again.")}
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={refresh}>{t("Try again")}</Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">{t("Your chains")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );

  const navigation = (
    <nav aria-label={t("Workspace")} className="flex h-full flex-col gap-1">
      <Link
        to="/dashboard"
        className="mb-6 flex items-center gap-2 px-3 py-2 text-xs text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("Your chains")}
      </Link>
      <p className="mb-2 px-3 text-[11px] font-medium text-fg-muted">
        {t("Workspace")}
      </p>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => navigate(id)}
          aria-current={activeTab === id ? "page" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
            activeTab === id
              ? "bg-surface-2 font-medium text-fg"
              : "text-fg-muted hover:bg-surface-2/60 hover:text-fg",
          )}
        >
          <Icon className="h-4 w-4" />
          {t(label)}
          {id === "chat" && unread > 0 && (
            <span className="ml-auto rounded bg-fg/10 px-1.5 text-[10px]">
              {mentions ? "@ " : ""}
              {unread}
            </span>
          )}
        </button>
      ))}
      <div className="mt-5 border-t border-border pt-4">
        <button
          onClick={() => {
            setNavOpen(false);
            setMembersOpen(true);
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          <Users className="h-4 w-4" />
          {t("Members")}
          <span className="ml-auto text-xs">{members.length}</span>
        </button>
      </div>
      <Link
        to="/settings#integrations"
        className="mt-auto flex items-center gap-2 rounded-md border border-border p-3 text-xs text-fg-muted hover:text-fg"
      >
        <Plug className="h-4 w-4" />
        {t("Connect your AI")}
      </Link>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <a href="#workspace-content" className="skip-link">
        {t("Skip to content")}
      </a>
      <ChainHeader
        chain={chain}
        memberCount={members.length}
        canEdit={myRole === "owner"}
        onRenamed={refresh}
        onOpenMembers={() => setMembersOpen(true)}
      />
      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 self-start border-r border-border bg-surface/50 p-3 lg:block">
          {navigation}
        </aside>
        <main
          id="workspace-content"
          className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center gap-3 border-b border-border pb-4 text-xs text-fg-muted">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:hidden"
                onClick={() => setNavOpen(true)}
                aria-label={t("Open navigation")}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Breadcrumb aria-label={t("Navigation")} className="min-w-0">
                <BreadcrumbList className="flex flex-wrap items-center gap-2">
                  <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/chain/${chain.id}`}>{chain.name}</Link></BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>{openProject ? <BreadcrumbLink asChild><Link to={`/chain/${chain.id}`}>{t("Projects")}</Link></BreadcrumbLink> : <BreadcrumbPage>{t(tabs.find((item) => item.id === activeTab)?.label ?? "Projects")}</BreadcrumbPage>}</BreadcrumbItem>
                  {openProject && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{t("Project")}</BreadcrumbPage></BreadcrumbItem></>}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div
              key={`${chain.id}:${activeTab}:${openProject ?? ""}`}
              className="animate-fade-rise"
            >
              {activeTab === "projects" && !openProject && (
                <ProjectListView
                  chainId={chain.id}
                  members={members}
                  canManage={myRole === "owner"}
                  onOpen={(id) => navigate("projects", id)}
                />
              )}
              {activeTab === "projects" && openProject && (
                <ProjectView
                  projectId={openProject}
                  members={members}
                  onBack={() => navigate("projects")}
                />
              )}
              {activeTab === "ideas" && (
                <IdeaList
                  chainId={chain.id}
                  projectId={null}
                  members={members}
                />
              )}
              {activeTab === "todos" && (
                <TodoList
                  chainId={chain.id}
                  projectId={null}
                  scope="all"
                  members={members}
                  heading="All tasks"
                />
              )}
              {activeTab === "chat" && (
                <ErrorBoundary
                  label="chat"
                  fallback={
                    <div
                      role="alert"
                      className="rounded-lg border border-border p-6"
                    >
                      <p className="mb-3">
                        {t("Check your connection and access, then try again.")}
                      </p>
                      <Button onClick={() => window.location.reload()}>
                        {t("Try again")}
                      </Button>
                    </div>
                  }
                >
                  <ChatPanel chainId={chain.id} members={members} />
                </ErrorBoundary>
              )}
            </div>
          </div>
        </main>
      </div>
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>{chain.name}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 pt-4">{navigation}</div>
        </SheetContent>
      </Sheet>
      <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("Members")}</SheetTitle>
          </SheetHeader>
          <MembersPanel
            chainId={chain.id}
            members={members}
            myRole={myRole}
            onChanged={refresh}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
