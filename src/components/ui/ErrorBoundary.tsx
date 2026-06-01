import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Rendered instead of the children when a descendant throws. Defaults to null. */
  fallback?: ReactNode;
  /** Tags the console error so we can tell which boundary caught it. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Minimal error boundary. Without one, a single component that throws during
 * render unmounts the whole React tree and the user sees a blank screen. Wrap
 * risky/optional UI (e.g. a feature that depends on a fresh DB migration) so its
 * failure is contained instead of taking down the page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(
      `[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
