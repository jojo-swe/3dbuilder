import React from 'react';

interface ErrorBoundaryProps {
  /** Rendered instead of `children` after an error. A function receives a `reset` callback that re-mounts the children. */
  fallback: React.ReactNode | ((reset: () => void) => React.ReactNode);
  /** Called once per caught error, e.g. to log it. */
  onError?: (error: unknown) => void;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Contains a render error to its own subtree so it can't unmount the whole app.
 * Works inside the React Three Fiber tree as well as the DOM tree.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    this.props.onError?.(error);
  }

  private readonly reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === 'function' ? fallback(this.reset) : fallback;
  }
}
