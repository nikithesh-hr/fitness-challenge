import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LogActivityForm from '../../../components/forms/LogActivityForm';

vi.mock('../../../api/activityApi', () => ({
  logActivity: vi.fn(),
}));

vi.mock('../../../components/forms/UserSearchPicker', () => ({
  default: ({ onSelect }) => (
    <button type="button" onClick={() => onSelect({ userId: 'user-1' })}>
      Pick User
    </button>
  ),
}));

import { logActivity } from '../../../api/activityApi';

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LogActivityForm />
    </QueryClientProvider>
  );
}

describe('LogActivityForm', () => {
  let randomUUIDSpy;

  beforeEach(() => {
    logActivity.mockReset();
    randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('key-1')
      .mockReturnValue('key-2');
  });

  afterEach(() => {
    randomUUIDSpy.mockRestore();
  });

  it('requires a selected user before submit', () => {
    const { container } = renderForm();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } });
    fireEvent.submit(container.querySelector('form'));
    expect(screen.getByText(/please select a user/i)).toBeInTheDocument();
    expect(logActivity).not.toHaveBeenCalled();
  });

  it('submits distance sport payload correctly', async () => {
    logActivity.mockResolvedValue({ pointsAwarded: 525 });
    const { container } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: /pick user/i }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5.25' } });
    fireEvent.change(screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}t\d{2}:\d{2}/i), { target: { value: '2026-08-18T12:00' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        sport: 'RUNNING',
        distanceKm: 5.25,
        recordedAt: '2026-08-18T12:00:00',
      }), 'key-1');
    });
    expect(screen.getByText(/you earned 525 points/i)).toBeInTheDocument();
  });

  it('submits duration sport payload correctly', async () => {
    logActivity.mockResolvedValue({ pointsAwarded: 225 });
    const { container } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: /pick user/i }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'GYM' } });
    fireEvent.change(screen.getByPlaceholderText(/minutes/i), { target: { value: '45' } });
    fireEvent.change(screen.getByPlaceholderText(/seconds/i), { target: { value: '50' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        sport: 'GYM',
        durationMinutes: 45,
        durationSeconds: 50,
      }), 'key-1');
    });
  });

  it('submits daily steps payload correctly', async () => {
    logActivity.mockResolvedValue({ pointsAwarded: 84 });
    const { container } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: /pick user/i }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DAILY_STEPS' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '8450' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        sport: 'DAILY_STEPS',
        stepCount: 8450,
      }), 'key-1');
    });
  });

  it('adds and submits extra fields and optional notes', async () => {
    logActivity.mockResolvedValue({ pointsAwarded: 10 });
    const { container } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: /pick user/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ add field/i }));
    fireEvent.change(screen.getByPlaceholderText('Key'), { target: { value: 'heartRate' } });
    fireEvent.change(screen.getByPlaceholderText('Value'), { target: { value: '145' } });
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Morning run' } });
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '1.0' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        notes: 'Morning run',
        extraFields: { heartRate: '145' },
      }), 'key-1');
    });
  });

  it('shows server field validation errors', async () => {
    logActivity.mockRejectedValue({
      errors: [{ field: 'distanceKm', message: 'distanceKm must be greater than 0' }],
    });
    const { container } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: /pick user/i }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => {
      expect(screen.getByText(/distanceKm must be greater than 0/i)).toBeInTheDocument();
    });
  });

  it('shows generic error message for non-field errors', async () => {
    logActivity.mockRejectedValue({ message: 'Server down' });
    const { container } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: /pick user/i }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(screen.getByText('Server down')).toBeInTheDocument());
  });
});
