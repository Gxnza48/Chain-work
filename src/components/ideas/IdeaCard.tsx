import { ListChecks, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import { notifyEvent } from '@/lib/push';
import { useAuth } from '@/hooks/useAuth';
import { useRelativeTimeTick } from '@/hooks/useRelativeTimeTick';
import { cn, htmlToText, initials, relativeTime } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { IdeaWithVotes } from '@/types';

interface Props {
  idea: IdeaWithVotes;
  onChange?: () => void;
}

export function IdeaCard({ idea, onChange }: Props) {
  const { user } = useAuth();
  const t = useT();
  useRelativeTimeTick();
  const isOwner = user?.id === idea.created_by;

  async function castVote(value: 1 | -1) {
    if (!user) return;
    if (idea.user_vote === value) {
      const { error } = await supabase
        .from('idea_votes')
        .delete()
        .eq('idea_id', idea.id)
        .eq('user_id', user.id);
      if (error) toast.error(t('Vote failed'), { description: error.message });
    } else {
      const { error } = await supabase
        .from('idea_votes')
        .upsert(
          { idea_id: idea.id, user_id: user.id, vote: value },
          { onConflict: 'idea_id,user_id' },
        );
      if (error) toast.error(t('Vote failed'), { description: error.message });
    }
    onChange?.();
  }

  async function convertToTodo() {
    if (!user) return;
    const { data, error } = await supabase
      .from('todos')
      .insert({
        chain_id: idea.chain_id,
        project_id: idea.project_id,
        title: idea.title,
        description: htmlToText(idea.description) || null,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (error) {
      toast.error(t('Could not create todo'), { description: error.message });
      return;
    }
    if (data) void notifyEvent('todo', { id: data.id });
    toast.success(t('Converted to a todo'), {
      description: t('Find it in the Todos tab.'),
    });
  }

  async function remove() {
    if (!window.confirm(t('Delete this idea? This cannot be undone.'))) return;
    const { error } = await supabase.from('ideas').delete().eq('id', idea.id);
    if (error) {
      toast.error(t('Could not delete'), { description: error.message });
      return;
    }
    toast.success(t('Idea deleted'));
    onChange?.();
  }

  return (
    <article className="flex gap-3 rounded-lg border-2 border-fg bg-surface p-4 shadow-brut-sm">
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => castVote(1)}
          aria-pressed={idea.user_vote === 1}
          aria-label={t('Upvote')}
          className={cn(
            'grid h-8 w-8 place-items-center rounded-md border-2 transition-colors',
            idea.user_vote === 1
              ? 'bg-accent-emerald text-white border-fg shadow-brut-sm'
              : 'bg-surface-2 text-fg border-fg hover:bg-surface',
          )}
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <span
          className={cn(
            'font-mono text-sm font-bold',
            idea.score > 0 ? 'text-accent-emerald' : idea.score < 0 ? 'text-accent-rose' : 'text-fg-muted',
          )}
        >
          {idea.score > 0 ? `+${idea.score}` : idea.score}
        </span>
        <button
          type="button"
          onClick={() => castVote(-1)}
          aria-pressed={idea.user_vote === -1}
          aria-label={t('Downvote')}
          className={cn(
            'grid h-8 w-8 place-items-center rounded-md border-2 transition-colors',
            idea.user_vote === -1
              ? 'bg-accent-rose text-white border-fg shadow-brut-sm'
              : 'bg-surface-2 text-fg border-fg hover:bg-surface',
          )}
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 break-words font-display text-lg font-bold tracking-tight">{idea.title}</h4>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={convertToTodo}
              aria-label={t('Convert to a todo')}
              title={t('Convert to a todo')}
              className="rounded-md p-1 text-fg-muted hover:bg-accent-blue/10 hover:text-accent-blue"
            >
              <ListChecks className="h-4 w-4" />
            </button>
            {isOwner ? (
              <button
                type="button"
                onClick={remove}
                aria-label={t('Delete idea')}
                className="rounded-md p-1 text-fg-muted hover:bg-accent-rose/10 hover:text-accent-rose"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {idea.description ? (
          <div
            className="prose prose-sm dark:prose-invert mt-2 max-w-none text-fg-muted"
            // controlled output from Tiptap (sanitised set: bold, italic, bullet list, paragraph)
            dangerouslySetInnerHTML={{ __html: idea.description }}
          />
        ) : null}

        <div className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
          {idea.author ? (
            <>
              <Avatar className="h-5 w-5">
                {idea.author.avatar_url ? (
                  <AvatarImage src={idea.author.avatar_url} alt={idea.author.display_name} />
                ) : null}
                <AvatarFallback className="text-[9px]">{initials(idea.author.display_name)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{idea.author.display_name}</span>
              <span className="font-mono">@{idea.author.username}</span>
            </>
          ) : null}
          <span className="font-mono">{relativeTime(idea.created_at)}</span>
        </div>
      </div>
    </article>
  );
}
