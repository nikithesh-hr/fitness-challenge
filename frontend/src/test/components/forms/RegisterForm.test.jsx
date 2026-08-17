import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterForm from '../../../components/forms/RegisterForm';

vi.mock('../../../api/userApi', () => ({
  registerUser: vi.fn(),
}));

import { registerUser } from '../../../api/userApi';

function renderForm() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <RegisterForm />
    </QueryClientProvider>
  );
}

describe('RegisterForm', () => {
  beforeEach(() => { registerUser.mockReset(); });

  // ── Initial render ─────────────────────────────────────────────────────────

  it('renders First Name, Last Name and Email fields', () => {
    renderForm();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders the Create Account submit button', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('all fields are initially empty', () => {
    renderForm();
    expect(screen.getByLabelText(/first name/i)).toHaveValue('');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
  });

  // ── Success ────────────────────────────────────────────────────────────────

  it('shows "Registration Successful!" message on success', async () => {
    registerUser.mockResolvedValue({ userId: 'abc', firstName: 'Jane' });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  it('shows "Register another user" link after success', async () => {
    registerUser.mockResolvedValue({ userId: 'abc' });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/register another user/i)).toBeInTheDocument();
    });
  });

  it('calls registerUser with form data on submit', async () => {
    registerUser.mockResolvedValue({ userId: 'abc' });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalled();
      expect(registerUser.mock.calls[0][0]).toEqual({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      });
    });
  });

  // ── Validation errors (400) ────────────────────────────────────────────────

  it('shows field-level error messages from API 400 response', async () => {
    registerUser.mockRejectedValue({
      errors: [
        { field: 'firstName', message: 'must not be blank' },
        { field: 'email', message: 'must be a valid email address' },
      ],
    });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'x');
    await user.type(screen.getByLabelText(/last name/i), 'y');
    await user.type(screen.getByLabelText(/email/i), 'bad@test.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('must not be blank')).toBeInTheDocument();
      expect(screen.getByText('must be a valid email address')).toBeInTheDocument();
    });
  });

  // ── 409 Conflict ──────────────────────────────────────────────────────────

  it('shows conflict banner on 409 Duplicate response', async () => {
    registerUser.mockRejectedValue({
      status: 409,
      message: 'User Jane Smith already exists.',
    });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane2@example.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      const matches = screen.getAllByText(/jane smith already exists/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Generic API error ──────────────────────────────────────────────────────

  it('shows generic error banner for non-field, non-409 errors', async () => {
    registerUser.mockRejectedValue({ message: 'Internal server error' });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  // ── Clicking "Register another user" resets form ───────────────────────────

  it('clicking "Register another user" restores the form', async () => {
    registerUser.mockResolvedValue({ userId: 'abc' });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => screen.getByText(/register another user/i));
    await user.click(screen.getByText(/register another user/i));

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
});
