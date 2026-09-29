// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;

function Flaky(): React.ReactNode {
  if (shouldThrow) throw new Error('HDR failed');
  return <span>scene</span>;
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup();
    shouldThrow = true;
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    shouldThrow = false;
    render(<ErrorBoundary fallback={<span>fallback</span>}><Flaky /></ErrorBoundary>);
    expect(screen.getByText('scene')).toBeTruthy();
  });

  it('contains the error: renders the fallback, keeps siblings mounted, and reports it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs caught errors
    const onError = vi.fn();
    render(
      <div>
        <span>2D editor</span>
        <ErrorBoundary fallback={<span>fallback</span>} onError={onError}><Flaky /></ErrorBoundary>
      </div>,
    );
    expect(screen.getByText('fallback')).toBeTruthy();
    expect(screen.getByText('2D editor')).toBeTruthy();
    expect(onError).toHaveBeenCalledOnce();
  });

  it('renders nothing for a null fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<ErrorBoundary fallback={null}><Flaky /></ErrorBoundary>);
    expect(container.innerHTML).toBe('');
  });

  it('re-mounts the children when the fallback calls reset', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={reset => <button onClick={reset}>Retry</button>}>
        <Flaky />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByText('Retry'));
    expect(screen.getByText('scene')).toBeTruthy();
  });
});
