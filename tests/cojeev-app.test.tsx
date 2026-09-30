// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Checkbox } from '@/components/cojeev/checkbox';
import { installMotionEnvironment } from './helpers/motion';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/lang';

beforeEach(installMotionEnvironment);
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('keeps slotted app links blocked while disabled and invokes native buttons once', async () => {
  const user = userEvent.setup();
  const activate = vi.fn();
  render(<><Button onClick={activate}>Save</Button><Button asChild disabled><a href="/dashboard" onClick={activate}>Blocked</a></Button></>);
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await user.click(screen.getByRole('link', { name: 'Blocked' }));
  expect(activate).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('link')).toHaveAttribute('aria-disabled', 'true');
});

it('preserves native form fields and checkbox keyboard interaction', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<><Input aria-label="Task name" error /><Checkbox aria-label="Complete subtask" onCheckedChange={change} /></>);
  await user.type(screen.getByRole('textbox'), 'Launch');
  expect(screen.getByRole('textbox')).toHaveValue('Launch');
  expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  await user.tab();
  await user.keyboard(' ');
  expect(change).toHaveBeenCalledWith(true);
  expect(screen.getByRole('checkbox')).toBeChecked();
});

it('preserves native submit semantics for existing application forms', async () => {
  const user = userEvent.setup();
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  render(<form onSubmit={submit}><Input aria-label="Project name" /><Button>Create project</Button></form>);
  await user.type(screen.getByRole('textbox'), 'Website');
  await user.click(screen.getByRole('button', { name: 'Create project' }));
  expect(submit).toHaveBeenCalledTimes(1);
});

it('keeps translation-dependent loaders stable until the language changes', () => {
  useLangStore.getState().setLang('en');
  const { result, rerender } = renderHook(() => useT());
  const translate = result.current;
  rerender();
  expect(result.current).toBe(translate);
  act(() => useLangStore.getState().setLang('es'));
  expect(result.current).not.toBe(translate);
  expect(result.current('Tasks')).toBe('Tareas');
});

it('keeps one app tab panel visible and supports keyboard selection', async () => {
  const user = userEvent.setup();
  render(<Tabs defaultValue="tasks"><TabsList aria-label="Project views"><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="context">Context</TabsTrigger></TabsList><TabsContent value="tasks">Task list</TabsContent><TabsContent value="context">Project brief</TabsContent></Tabs>);
  await user.click(screen.getByRole('tab', { name: 'Tasks' }));
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Context' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Project brief');
});
