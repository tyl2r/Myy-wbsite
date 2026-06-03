import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Can } from './can';
import { useAuth } from '@/stores/auth.store';

function setRole(role: 'user' | 'worker' | 'admin') {
  useAuth.setState({
    user: { id: '1', email: 'a@b.dev', fullName: 'A', role },
    accessToken: 't',
    status: 'authenticated',
  });
}

describe('<Can>', () => {
  beforeEach(() => useAuth.setState({ user: null, accessToken: null, status: 'idle' }));

  it('renders children when the role holds the capability', () => {
    setRole('user');
    render(
      <Can capability="request.create">
        <span>allowed</span>
      </Can>,
    );
    expect(screen.getByText('allowed')).toBeInTheDocument();
  });

  it('renders the fallback when the capability is missing', () => {
    setRole('worker');
    render(
      <Can capability="request.create" fallback={<span>denied</span>}>
        <span>allowed</span>
      </Can>,
    );
    expect(screen.getByText('denied')).toBeInTheDocument();
    expect(screen.queryByText('allowed')).not.toBeInTheDocument();
  });
});
