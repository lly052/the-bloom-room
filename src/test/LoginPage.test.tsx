import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../components/LoginPage';

const mockSignIn = vi.fn();

vi.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
    },
  },
}));

describe('LoginPage', () => {
  const onLoginSuccess = vi.fn();
  const onGoToSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    render(<LoginPage onLoginSuccess={onLoginSuccess} onGoToSignUp={onGoToSignUp} />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows an error message when login fails', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

    render(<LoginPage onLoginSuccess={onLoginSuccess} onGoToSignUp={onGoToSignUp} />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'wrong@email.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });

  it('calls onLoginSuccess when login succeeds', async () => {
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginPage onLoginSuccess={onLoginSuccess} onGoToSignUp={onGoToSignUp} />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledOnce();
    });
  });

  it('navigates to sign up when the link is clicked', () => {
    render(<LoginPage onLoginSuccess={onLoginSuccess} onGoToSignUp={onGoToSignUp} />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(onGoToSignUp).toHaveBeenCalledOnce();
  });
});
