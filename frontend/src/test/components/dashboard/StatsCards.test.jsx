import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCards from '../../../components/dashboard/StatsCards';

describe('StatsCards', () => {
  it('renders total points with locale formatting', () => {
    render(<StatsCards totalPoints={12500} totalActivities={10} />);
    expect(screen.getByText('12,500')).toBeInTheDocument();
  });

  it('renders "Total Points" label', () => {
    render(<StatsCards totalPoints={500} totalActivities={3} />);
    expect(screen.getByText(/total points/i)).toBeInTheDocument();
  });

  it('renders total activities count', () => {
    render(<StatsCards totalPoints={0} totalActivities={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders "Activities" label', () => {
    render(<StatsCards totalPoints={0} totalActivities={0} />);
    expect(screen.getByText(/activities/i)).toBeInTheDocument();
  });

  it('renders zero points as "0"', () => {
    render(<StatsCards totalPoints={0} totalActivities={5} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders "cumulative score" subtitle', () => {
    render(<StatsCards totalPoints={100} totalActivities={1} />);
    expect(screen.getByText(/cumulative score/i)).toBeInTheDocument();
  });

  it('renders "sessions logged" subtitle', () => {
    render(<StatsCards totalPoints={100} totalActivities={1} />);
    expect(screen.getByText(/sessions logged/i)).toBeInTheDocument();
  });
});
