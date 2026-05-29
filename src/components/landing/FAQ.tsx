import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';

interface QA {
  q: string;
  a: string;
}

const QUESTIONS: QA[] = [
  {
    q: 'What is a chain?',
    a: 'A chain is a shared workspace. Every chain has a unique 8-character code; share the code and your teammates land in the same projects, todos, ideas, and attachments as you — with realtime presence.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Beta is free for everyone. We will share pricing well before turning anything on — and grandfather early users.',
  },
  {
    q: 'How is this different from Notion or Linear?',
    a: 'Notion is flexible but unstructured; Linear is rigid but task-shaped. ChainWork is a small, opinionated middle: chains for context, projects for scope, todos for execution, ideas for thinking out loud. Nothing else.',
  },
  {
    q: 'Can I invite people who don\'t have an account?',
    a: 'Yes. Anyone can sign up free in under a minute and then enter the chain code to join.',
  },
  {
    q: 'How does realtime presence work?',
    a: 'When you open a chain we join a single presence channel. The members panel updates instantly when teammates come and go — no polling, no extra writes to the database.',
  },
  {
    q: 'Can I delete a completed todo?',
    a: 'No. Completed todos become part of the project Roadmap — an append-only history of what your team shipped. You can re-open one to move it back to pending or in_progress.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Every table has row-level security. Only members of a chain can read or write its rows — verified with policies, not just app logic.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative scroll-mt-28 py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="font-display font-bold text-xs uppercase tracking-[0.2em] text-accent-emerald">
            FAQ
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Honest answers.
          </h2>
        </div>
        <Accordion type="single" collapsible defaultValue="q-0" className="mt-10">
          {QUESTIONS.map((qa, i) => (
            <AccordionItem key={qa.q} value={`q-${i}`}>
              <AccordionTrigger>{qa.q}</AccordionTrigger>
              <AccordionContent>{qa.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
