import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserSearchPicker from '../../../components/forms/UserSearchPicker';

vi.mock('../../../hooks/useRecentUsers', () => ({
  useRecentUsers: vi.fn(),
}));

vi.mock('../../../hooks/useUserSearch', () => ({
  useUserSearch: vi.fn(),
}));

vi.mock('../../../api/userApi', async () => {
  const actual = await vi.importActual('../../../api/userApi');
  return {
    ...actual,
    registerUser: vi.fn(),
  };
});

import { useRecentUsers } from '../../../hooks/useRecentUsers';
import { useUserSearch } from '../../../hooks/useUserSearch';
import { registerUser } from '../../../api/userApi';

function renderPicker(props = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <UserSearchPicker onSelect={vi.fn()} {...props} />
    </QueryClientProvider>
  );
}

const jane = { userId: 'u-1', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' };
const john = { userId: 'u-2', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

describe('UserSearchPicker', () => {
  function fillRegisterForm({ firstName, lastName, email }) {
    const textboxes = screen.getAllByRole('textbox');
    fireEvent.change(textboxes[1], { target: { value: firstName } });
    fireEvent.change(textboxes[2], { target: { value: lastName } });
    fireEvent.change(textboxes[3], { target: { value: email } });
  }

  beforeEach(() => {
    useRecentUsers.mockReset();
    useUserSearch.mockReset();
    registerUser.mockReset();
    useRecentUsers.mockReturnValue({ data: [jane], isLoading: false });
    useUserSearch.mockReturnValue({ data: [john], isLoading: false });
  });

  it('shows recent users on focus', () => {
    renderPicker();
    fireEvent.focus(screen.getByPlaceholderText(/search by name or email/i));
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText(/type to search all users/i)).toBeInTheDocument();
  });

  it('calls search hook with query text and shows search results', () => {
    renderPicker();
    fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), { target: { value: 'jo' } });
    expect(useUserSearch).toHaveBeenCalledWith('jo');
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('selects a user and shows selected badge', async () => {
    const onSelect = vi.fn();
    renderPicker({ onSelect });
    fireEvent.focus(screen.getByPlaceholderText(/search by name or email/i));
    fireEvent.mouseDown(screen.getByRole('button', { name: /jane smith/i }));
    expect(onSelect).toHaveBeenCalledWith(jane);
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
  });

  it('returns to searching mode when Change is clicked', () => {
    renderPicker();
    fireEvent.focus(screen.getByPlaceholderText(/search by name or email/i));
    fireEvent.mouseDown(screen.getByRole('button', { name: /jane smith/i }));
    fireEvent.click(screen.getByRole('button', { name: /change/i }));
    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
  });

  it('shows inline register form when no results and register is allowed', () => {
    useUserSearch.mockReturnValue({ data: [], isLoading: false });
    renderPicker();
    fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), { target: { value: 'zz' } });
    fireEvent.mouseDown(screen.getByRole('button', { name: /\+ register new user/i }));
    expect(screen.getByText(/register new user/i)).toBeInTheDocument();
  });

  it('registers and selects the created user', async () => {
    registerUser.mockResolvedValue({ userId: 'u-3', firstName: 'New', lastName: 'User', email: 'new@example.com' });
    useUserSearch.mockReturnValue({ data: [], isLoading: false });
    const onSelect = vi.fn();
    renderPicker({ onSelect });

    fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), { target: { value: 'zz' } });
    fireEvent.mouseDown(screen.getByRole('button', { name: /\+ register new user/i }));

    fillRegisterForm({ firstName: 'New', lastName: 'User', email: 'new@example.com' });
    fireEvent.click(screen.getByRole('button', { name: /create & select/i }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
      }, expect.anything());
    });
    expect(onSelect).toHaveBeenCalledWith({
      userId: 'u-3',
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
    });
  });

  it('maps duplicate email error onto email field', async () => {
    registerUser.mockRejectedValue({ status: 409, message: 'Email already exists.' });
    useUserSearch.mockReturnValue({ data: [], isLoading: false });
    renderPicker();

    fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), { target: { value: 'zz' } });
    fireEvent.mouseDown(screen.getByRole('button', { name: /\+ register new user/i }));
    fillRegisterForm({ firstName: 'New', lastName: 'User', email: 'new@example.com' });
    fireEvent.click(screen.getByRole('button', { name: /create & select/i }));

    await waitFor(() => expect(screen.getByText(/email already exists/i)).toBeInTheDocument());
  });
});
