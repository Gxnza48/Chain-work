import { htmlToText } from '@/lib/utils';
import type { AttachmentRow, IdeaRow, ProjectRow, TodoRow } from '@/types';

/** Trigger a client-side file download (no server round-trip). */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** A filesystem-safe slug for a project name. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'project'
  );
}

const STATUS_GROUPS: { key: TodoRow['status']; heading: string }[] = [
  { key: 'in_progress', heading: 'In progress' },
  { key: 'pending', heading: 'Pending' },
  { key: 'done', heading: 'Done' },
];

const PRIORITY_LABEL: Record<TodoRow['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/**
 * Render a project (with its todos, ideas and attachments) as a portable
 * Markdown document — handy to paste into a doc, an issue, or a standup update.
 */
export function buildProjectMarkdown(
  project: Pick<ProjectRow, 'name' | 'description'>,
  todos: TodoRow[],
  ideas: IdeaRow[],
  attachments: AttachmentRow[],
): string {
  const lines: string[] = [];
  lines.push(`# ${project.name}`);
  if (project.description) lines.push('', project.description);

  const total = todos.length;
  const done = todos.filter((t) => t.status === 'done').length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  lines.push('', `**Progress:** ${done}/${total} todos (${pct}%)`);

  lines.push('', '## Todos');
  if (todos.length === 0) {
    lines.push('', '_No todos yet._');
  } else {
    for (const group of STATUS_GROUPS) {
      const items = todos.filter((t) => t.status === group.key);
      if (items.length === 0) continue;
      lines.push('', `### ${group.heading} (${items.length})`);
      for (const todo of items) {
        const box = todo.status === 'done' ? '[x]' : '[ ]';
        const tags: string[] = [PRIORITY_LABEL[todo.priority]];
        if (todo.due_date) tags.push(`due ${todo.due_date.slice(0, 10)}`);
        lines.push(`- ${box} ${todo.title} _(${tags.join(', ')})_`);
        if (todo.description) {
          lines.push(`  - ${todo.description.replace(/\n+/g, ' ').trim()}`);
        }
      }
    }
  }

  lines.push('', '## Ideas');
  if (ideas.length === 0) {
    lines.push('', '_No ideas yet._');
  } else {
    for (const idea of ideas) {
      lines.push(`- **${idea.title}**`);
      const text = htmlToText(idea.description);
      if (text) lines.push(`  - ${text}`);
    }
  }

  lines.push('', '## Links & Media');
  if (attachments.length === 0) {
    lines.push('', '_Nothing attached yet._');
  } else {
    for (const a of attachments) {
      lines.push(`- [${a.title || a.url}](${a.url}) _(${a.type})_`);
    }
  }

  lines.push('', '---', `_Exported from ChainWork on ${new Date().toLocaleString()}_`);
  return lines.join('\n');
}

export function buildProjectJSON(
  project: Pick<ProjectRow, 'name' | 'description'>,
  todos: TodoRow[],
  ideas: IdeaRow[],
  attachments: AttachmentRow[],
): string {
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      project,
      todos: todos.map((t) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
      })),
      ideas: ideas.map((i) => ({ title: i.title, description: htmlToText(i.description) })),
      attachments: attachments.map((a) => ({ title: a.title, url: a.url, type: a.type })),
    },
    null,
    2,
  );
}
