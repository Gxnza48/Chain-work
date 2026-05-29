import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Folder, Lightbulb, ListTodo, Menu, RefreshCw } from 'lucide-react';
import { ChainHeader } from '@/components/chain/ChainHeader';
import { MembersPanel } from '@/components/chain/MembersPanel';
import { ProjectListView } from '@/components/project/ProjectListView';
import { ProjectView } from '@/components/project/ProjectView';
import { TodoList } from '@/components/todos/TodoList';
import { IdeaList } from '@/components/ideas/IdeaList';
import { Sheet, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/Sheet';
import { useChain } from '@/hooks/useChain';
import { cn } from '@/lib/utils';

type Tab = 'projects' | 'ideas' | 'todos';

export default function ChainPage() {
  const { chainId } = useParams<{ chainId: string }>();
  const { chain, members, loading, error } = useChain(chainId);

  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  useEffect(() => {
    if (activeTab !== 'projects') setOpenProject(null);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-fg-muted">
        <span className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin-slow" /> Loading chain…
        </span>
      </div>
    );
  }

  if (error || !chain) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <ChainHeader chain={chain} memberCount={members.length} onOpenMembers={() => setMembersOpen(true)} />

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
            Workspace
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
            Projects
          </NavButton>
          <NavButton
            active={activeTab === 'ideas'}
            onClick={() => {
              setActiveTab('ideas');
              setNavOpen(false);
            }}
            icon={<Lightbulb className="h-4 w-4" />}
          >
            Ideas
          </NavButton>
          <NavButton
            active={activeTab === 'todos'}
            onClick={() => {
              setActiveTab('todos');
              setNavOpen(false);
            }}
            icon={<ListTodo className="h-4 w-4" />}
          >
            All todos
          </NavButton>
        </aside>

        {/* Mobile open-left-rail trigger */}
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="fixed left-3 top-16 z-20 inline-grid h-9 w-9 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        {navOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          />
        ) : null}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 pt-16 lg:pt-6 sm:p-6 overflow-x-hidden">
          {activeTab === 'projects' && !openProject ? (
            <ProjectListView chainId={chain.id} members={members} onOpen={(id) => setOpenProject(id)} />
          ) : null}
          {activeTab === 'projects' && openProject ? (
            <ProjectView
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
        </main>

        {/* Right rail: members */}
        <aside className="hidden w-72 shrink-0 border-l-2 border-fg bg-surface lg:block">
          <MembersPanel chainId={chain.id} members={members} />
        </aside>
      </div>

      {/* Mobile members sheet */}
      <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
        <SheetContent side="bottom" className="lg:hidden">
          <SheetHeader>
            <SheetTitle>Members</SheetTitle>
          </SheetHeader>
          <MembersPanel chainId={chain.id} members={members} />
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
