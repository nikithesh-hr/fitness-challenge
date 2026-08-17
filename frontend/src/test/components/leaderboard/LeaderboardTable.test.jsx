import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LeaderboardTable from '../../../components/leaderboard/LeaderboardTable';

const makeEntry = (rank, fullName, totalPoints, userId = `user-${rank}`) => ({
  rank, fullName, totalPoints, userId,
});

function renderTable(entries, onDelete) {
  return render(
    <MemoryRouter>
      <LeaderboardTable entries={entries} onDelete={onDelete} />
    </MemoryRouter>
  );
}

describe('LeaderboardTable', () => {
  // ── Empty state ────────────────────────────────────────────────────────────

  it('shows empty state when entries is undefined', () => {
    render(<MemoryRouter><LeaderboardTable /></MemoryRouter>);
    expect(screen.getByText(/no activity recorded yet/i)).toBeInTheDocument();
  });

  it('shows empty state when entries is an empty array', () => {
    renderTable([]);
    expect(screen.getByText(/no activity recorded yet/i)).toBeInTheDocument();
  });

  // ── Medal rendering ────────────────────────────────────────────────────────

  it('rank 1 shows gold medal 🥇', () => {
    renderTable([makeEntry(1, 'Alice Brown', 2000)]);
    expect(screen.getByText('🥇')).toBeInTheDocument();
  });

  it('rank 2 shows silver medal 🥈', () => {
    renderTable([makeEntry(2, 'Bob Jones', 1500)]);
    expect(screen.getByText('🥈')).toBeInTheDocument();
  });

  it('rank 3 shows bronze medal 🥉', () => {
    renderTable([makeEntry(3, 'Carol White', 800)]);
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('rank 4+ shows #N notation, not a medal', () => {
    renderTable([makeEntry(4, 'Dave Green', 500)]);
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.queryByText('🥇')).not.toBeInTheDocument();
    expect(screen.queryByText('🥈')).not.toBeInTheDocument();
    expect(screen.queryByText('🥉')).not.toBeInTheDocument();
  });

  // ── Full name ──────────────────────────────────────────────────────────────

  it('displays the full name of each athlete', () => {
    renderTable([makeEntry(1, 'Jane Smith', 1000)]);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  // ── Points formatting ──────────────────────────────────────────────────────

  it('displays points formatted with locale separator for large numbers', () => {
    renderTable([makeEntry(1, 'Top User', 12000)]);
    expect(screen.getByText('12,000')).toBeInTheDocument();
  });

  it('shows zero points correctly', () => {
    renderTable([makeEntry(1, 'New User', 0)]);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  // ── Table headers ──────────────────────────────────────────────────────────

  it('renders Rank, Athlete and Total Points column headers', () => {
    renderTable([makeEntry(1, 'Alice', 100)]);
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Athlete')).toBeInTheDocument();
    expect(screen.getByText('Total Points')).toBeInTheDocument();
  });

  // ── Multiple entries ───────────────────────────────────────────────────────

  it('renders all three top entries with correct medals', () => {
    const entries = [
      makeEntry(1, 'Alice Brown', 2000),
      makeEntry(2, 'Bob Jones',   1500),
      makeEntry(3, 'Carol White',  800),
    ];
    renderTable(entries);
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Carol White')).toBeInTheDocument();
  });

  it('renders a mix of top-3 and lower ranks correctly', () => {
    const entries = [
      makeEntry(1, 'Alice', 2000),
      makeEntry(4, 'Dave',   500),
    ];
    renderTable(entries);
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  // ── Athlete name links to dashboard ───────────────────────────────────────

  it('athlete name is a link to /dashboard?userId=...', () => {
    renderTable([makeEntry(1, 'Alice Brown', 2000, 'u-alice')]);
    const link = screen.getByRole('link', { name: 'Alice Brown' });
    expect(link).toHaveAttribute('href', '/dashboard?userId=u-alice');
  });

  // ── Delete button ──────────────────────────────────────────────────────────

  it('shows a delete (trash) button for each row', () => {
    const entries = [
      makeEntry(1, 'Alice', 2000, 'u-1'),
      makeEntry(2, 'Bob',   1500, 'u-2'),
    ];
    renderTable(entries, vi.fn());
    expect(screen.getAllByTitle('Delete user')).toHaveLength(2);
  });

  it('shows "Yes, delete" and "Cancel" after clicking trash icon', () => {
    renderTable([makeEntry(1, 'Alice', 2000)], vi.fn());
    fireEvent.click(screen.getByTitle('Delete user'));
    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows warning text in the row when confirming', () => {
    renderTable([makeEntry(1, 'Alice', 2000)], vi.fn());
    fireEvent.click(screen.getByTitle('Delete user'));
    expect(screen.getByText(/delete this user and all their activities/i)).toBeInTheDocument();
  });

  it('hides confirmation and restores trash button after Cancel', () => {
    renderTable([makeEntry(1, 'Alice', 2000)], vi.fn());
    fireEvent.click(screen.getByTitle('Delete user'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Yes, delete')).not.toBeInTheDocument();
    expect(screen.getByTitle('Delete user')).toBeInTheDocument();
  });

  it('calls onDelete with the entry object when "Yes, delete" is clicked', () => {
    const onDelete = vi.fn();
    const entry = makeEntry(1, 'Alice', 2000, 'u-alice');
    renderTable([entry], onDelete);
    fireEvent.click(screen.getByTitle('Delete user'));
    fireEvent.click(screen.getByText('Yes, delete'));
    expect(onDelete).toHaveBeenCalledWith(entry);
  });

  it('does not call onDelete when Cancel is clicked', () => {
    const onDelete = vi.fn();
    renderTable([makeEntry(1, 'Alice', 2000)], onDelete);
    fireEvent.click(screen.getByTitle('Delete user'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('only shows confirmation for the clicked row, not others', () => {
    const entries = [
      makeEntry(1, 'Alice', 2000, 'u-1'),
      makeEntry(2, 'Bob',   1500, 'u-2'),
    ];
    renderTable(entries, vi.fn());
    const trashButtons = screen.getAllByTitle('Delete user');
    fireEvent.click(trashButtons[0]);
    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
    // Bob's row should still show the trash icon (not in confirmation state)
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
