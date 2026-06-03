import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders the human label for a status', () => {
    render(<StatusBadge status="in_transit" />);
    expect(screen.getByText('In transit')).toBeInTheDocument();
  });

  it('renders terminal statuses', () => {
    render(<StatusBadge status="confirmed" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });
});
