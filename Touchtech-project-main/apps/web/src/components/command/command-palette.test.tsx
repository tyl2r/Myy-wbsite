import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from './command-palette';
import { useUi } from '@/stores/ui.store';
import { useAuth } from '@/stores/auth.store';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

function openPalette() {
  useUi.setState({ paletteOpen: true });
  useAuth.setState({
    user: { id: '1', email: 'a@b.dev', fullName: 'A', role: 'admin' },
    accessToken: 't',
    status: 'authenticated',
  });
}

describe('CommandPalette', () => {
  beforeEach(() => {
    push.mockClear();
    useUi.setState({ paletteOpen: false });
  });

  it('shows role-aware destinations when open', () => {
    openPalette();
    render(<CommandPalette />);
    // Admin nav includes Live operations and Users.
    expect(screen.getByText('Live operations')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('filters results by query', () => {
    openPalette();
    render(<CommandPalette />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'work' } });
    expect(screen.getByText('Workers')).toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('navigates with arrow keys + enter', () => {
    openPalette();
    render(<CommandPalette />);
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    openPalette();
    render(<CommandPalette />);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(useUi.getState().paletteOpen).toBe(false);
  });

  it('merges dynamic extra entries', () => {
    openPalette();
    render(
      <CommandPalette
        extra={[{ id: 'r-1042', label: 'Request #1042', group: 'Requests', href: '/requests/1042' }]}
      />,
    );
    expect(screen.getByText('Request #1042')).toBeInTheDocument();
  });
});
