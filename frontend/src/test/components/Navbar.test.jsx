import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';

function renderNavbar(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Navbar />
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  it('renders the FitChallenge brand logo link', () => {
    renderNavbar();
    expect(screen.getByText(/fitchallenge/i)).toBeInTheDocument();
  });

  it('renders a Home navigation link', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
  });

  it('renders a Leaderboard navigation link', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /leaderboard/i })).toBeInTheDocument();
  });

  it('renders a Dashboard navigation link', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders a Log Activity navigation link', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /log activity/i })).toBeInTheDocument();
  });

  it('renders a Register button link on the far right', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('Home link href is "/"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
  });

  it('Leaderboard link href is "/leaderboard"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /leaderboard/i })).toHaveAttribute('href', '/leaderboard');
  });

  it('Dashboard link href is "/dashboard"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
  });

  it('Log Activity link href is "/log-activity"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /log activity/i })).toHaveAttribute('href', '/log-activity');
  });

  it('Register link href is "/register"', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /^register$/i })).toHaveAttribute('href', '/register');
  });

  it('does not show a logout button', () => {
    renderNavbar();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });
});
