import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Folder, Lightbulb, ListTodo, Menu, MessageSquare } from 'lucide-react';
import { ChainLoader } from '@/components/ui/ChainLoader';
import { ChainHeader } from '@/components/chain/ChainHeader';
import { MembersPanel } from '@/components/chain/MembersPanel';
import { ProjectListView } from '@/components/project/ProjectListView';
import { ProjectView } from '@/components/project/ProjectView';
import { TodoList } from '@/components/todos/TodoList';
import { IdeaList } from '@/components/ideas/IdeaList';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Sheet, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/Sheet';
import { useChain } from '@/hooks/useChain';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Tab = 'projects' | 'ideas' | 'todos' | 'chat';

export default function ChainPage() {
  const { chainId } = useParams<{ chainId: string }>();
  const { chain, members, myRole, loading, error, refresh } = useChain(chainId);
  const t = useT();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'chat' ? 'chat' : 'projects',
  );
  const [openProject, setOpenProject] = useState<string | null>(() => searchParams.get('project'));
  const [navOpen, setNavOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  useEffect(() => {
    if (activeTab !== 'projects') setOpenProject(null);
  }, [activeTab]);

  // Keep the URL (?project=ID) in sync so an open project is deep-linkable —
  // used by the command palette and the dashboard's "Jump back in" strip.
  useEffect(() => {
    const cur = searchParams.get('project');
    if (openProject === (cur ?? null)) return;
    const next = new URLSearchParams(searchParams);
    if (openProject) next.set('project', openProject);
    else next.delete('project');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProject]);

  // React to external deep-links (e.g. palette) while already on this chain.
  useEffect(() => {
    const p = searchParams.get('project');
    if (p && p !== openProject) {
      setActiveTab('projects');
      setOpenProject(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (loading) {
    return <ChainLoader fullscreen label={t('Loading chain…')} />;
  }

  if (error || !chain) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <ChainHeader
        chain={chain}
        memberCount={members.length}
        canEdit={myRole === 'owner'}
        onRenamed={refresh}
        onOpenMembers={() => setMembersOpen(true)}
      />

      <div className="flex flex-1 min-h-0">
        {/* Left rail */}
        <aside
          className={cn(
            'fixed inset-y-14 left-0 z-30 w-60 border-r-2 border-fg bg-surface p-3 flex flex-col gap-1',
            'transition-transform duration-200 lg:relative lg:inset-y-0 lg:translate-x-0',
            navOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <p className="px-2 pb-1 pt-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-fg-muted">
            {t('Workspace')}
          </p>
          <NavButton
            active={activeTab === 'projects' && !openProject}
            onClick={() => {
              setActiveTab('projects');
              setOpenProject(null);
              setNavOpen(false);
            }}
            icon={<Folder className="h-4 w-4" />}
          >
            {t('Projects')}
          </NavButton>
          <NavButton
            active={activeTab === 'ideas'}
            onClick={() => {
              setActiveTab('ideas');
              setNavOpen(false);
            }}
            icon={<Lightbulb className="h-4 w-4" />}
          >
            {t('Ideas')}
          </NavButton>
          <NavButton
            active={activeTab === 'todos'}
            onClick={() => {
              setActiveTab('todos');
              setNavOpen(false);
            }}
            icon={<ListTodo className="h-4 w-4" />}
          >
            {t('All todos')}
          </NavButton>
          <NavButton
            active={activeTab === 'chat'}
            onClick={() => {
              setActiveTab('chat');
              setNavOpen(false);
            }}
            icon={<MessageSquare className="h-4 w-4" />}
          >
            {t('Chat')}
          </NavButton>
        </aside>

        {/* Mobile open-left-rail trigger */}
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="fixed left-3 top-16 z-20 inline-grid h-9 w-9 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm lg:hidden"
          aria-label={t('Open navigation')}
        >
          <Menu className="h-4 w-4" />
        </button>

        {navOpen ? (
          <button
            type="button"
            aria-label={t('Close navigation')}
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          />
        ) : null}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 pt-16 lg:pt-6 sm:p-6 overflow-x-hidden">
          {activeTab === 'projects' && !openProject ? (
            <ProjectListView
              chainId={chain.id}
              members={members}
              canManage={myRole === 'owner'}
              onOpen={(id) => setOpenProject(id)}
            />
          ) : null}
          {activeTab === 'projects' && openProject ? (
            <ProjectView
              key={openProject}
              projectId={openProject}
              members={members}
              onBack={() => setOpenProject(null)}
            />
          ) : null}
          {activeTab === 'ideas' ? (
            <IdeaList chainId={chain.id} projectId={null} members={members} />
          ) : null}
          {activeTab === 'todos' ? (
            <TodoList
              chainId={chain.id}
              projectId={null}
              members={members}
              heading="All chain todos"
            />
          ) : null}
          {activeTab === 'chat' ? (
            <ErrorBoundary
              label="chat"
              fallback={
                <div className="grid h-[40vh] place-items-center rounded-lg border-2 border-dashed border-fg bg-surface-2 p-6 text-center">
                  <p className="text-sm text-fg-muted">{t('Something went wrong. Try reloading.')}</p>
                </div>
              }
            >
              <ChatPanel chainId={chain.id} members={members} />
            </ErrorBoundary>
          ) : null}
        </main>

        {/* Right rail: members */}
        <aside className="hidden w-72 shrink-0 border-l-2 border-fg bg-surface lg:block">
          <MembersPanel chainId={chain.id} members={members} myRole={myRole} onChanged={refresh} />
        </aside>
      </div>

      {/* Mobile members sheet */}
      <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
        <SheetContent side="bottom" className="lg:hidden">
          <SheetHeader>
            <SheetTitle>{t('Members')}</SheetTitle>
          </SheetHeader>
          <MembersPanel chainId={chain.id} members={members} myRole={myRole} onChanged={refresh} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavButton({ active, onClick, icon, children }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
        active
          ? 'border-2 border-fg bg-surface-2 text-fg shadow-brut-sm'
          : 'border-2 border-transparent text-fg-muted hover:text-fg hover:bg-surface-2',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
