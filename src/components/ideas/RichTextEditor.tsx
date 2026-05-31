import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: Props) {
  const t = useT();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        code: false,
        orderedList: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? t('Describe the idea…') }),
    ],
    content: value || '<p></p>',
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] max-h-[280px] overflow-y-auto rounded-b-md bg-surface-2 px-3 py-2 text-base text-fg outline-none focus:ring-2 focus:ring-accent-blue prose prose-sm dark:prose-invert max-w-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value || '<p></p>', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  return (
    <div className={cn('rounded-md border-2 border-fg overflow-hidden bg-surface-2', className)}>
      <div className="flex items-center gap-1 border-b-2 border-fg bg-surface px-2 py-1">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label={t('Bold')}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label={t('Italic')}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label={t('Bullet list')}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-grid h-8 w-8 place-items-center rounded-md border-2 text-fg transition-colors',
        active ? 'bg-accent-blue text-white border-fg' : 'bg-surface-2 border-transparent hover:bg-surface',
      )}
    >
      {children}
    </button>
  );
}
