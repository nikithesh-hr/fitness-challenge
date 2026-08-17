import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',             label: 'Home' },
  { to: '/leaderboard',  label: 'Leaderboard' },
  { to: '/dashboard',    label: 'Dashboard' },
  { to: '/log-activity', label: 'Log Activity' },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-brand-600 text-lg">
          <span>🏆</span> FitChallenge
        </NavLink>

        <div className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <NavLink
          to="/register"
          className={({ isActive }) =>
            `text-sm font-semibold px-4 py-1.5 rounded-md transition-colors ${
              isActive
                ? 'bg-brand-700 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`
          }
        >
          Register
        </NavLink>
      </div>
    </nav>
  );
}
