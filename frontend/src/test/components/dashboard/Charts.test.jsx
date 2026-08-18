import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeeklyVolumeChart from '../../../components/dashboard/WeeklyVolumeChart';
import SportBreakdownChart from '../../../components/dashboard/SportBreakdownChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive">{children}</div>,
  LineChart: ({ children, data }) => <div data-testid="line-chart" data-points={data.length}>{children}</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>Grid</div>,
  Tooltip: () => <div>Tooltip</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data }) => <div data-testid="pie" data-points={data.length}>{children}</div>,
  Cell: () => <div>Cell</div>,
  Legend: () => <div>Legend</div>,
}));

describe('WeeklyVolumeChart', () => {
  it('shows empty state when no weekly data exists', () => {
    render(<WeeklyVolumeChart weeklyVolume={[]} />);
    expect(screen.getByText(/no weekly data yet/i)).toBeInTheDocument();
  });

  it('renders the chart when weekly data exists', () => {
    render(<WeeklyVolumeChart weeklyVolume={[{ week: '2026-08-04', totalPoints: 50, activityCount: 1 }]} />);
    expect(screen.getByText(/volume over time/i)).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-points', '1');
  });

  it('filters invalid weeks and fills missing weeks between valid entries', () => {
    render(
      <WeeklyVolumeChart
        weeklyVolume={[
          { week: '2026-08-04', totalPoints: 50, activityCount: 1 },
          { week: 'bad-week', totalPoints: 99, activityCount: 9 },
          { week: '2026-08-18', totalPoints: 70, activityCount: 2 },
        ]}
      />
    );
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-points', '3');
  });
});

describe('SportBreakdownChart', () => {
  it('shows empty state when no sport data exists', () => {
    render(<SportBreakdownChart sportBreakdown={{}} />);
    expect(screen.getByText(/no activity data yet/i)).toBeInTheDocument();
  });

  it('renders the pie chart when sport data exists', () => {
    render(<SportBreakdownChart sportBreakdown={{ RUNNING: 120, SWIMMING: 30 }} />);
    expect(screen.getByText(/sport preference/i)).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toHaveAttribute('data-points', '2');
  });
});
