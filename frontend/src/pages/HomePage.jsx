import { Link } from 'react-router-dom';

const NAV_CARDS = [
  {
    to: '/register',
    icon: '🏅',
    title: 'Register',
    description: 'Create your account and join the competition',
    color: 'bg-brand-50 border-brand-100 hover:border-brand-300',
    titleColor: 'text-brand-700',
  },
  {
    to: '/log-activity',
    icon: '⚡',
    title: 'Log Activity',
    description: 'Record a workout and earn points instantly',
    color: 'bg-orange-50 border-orange-100 hover:border-orange-300',
    titleColor: 'text-orange-700',
  },
  {
    to: '/leaderboard',
    icon: '🏆',
    title: 'Leaderboard',
    description: 'See global rankings across all athletes',
    color: 'bg-yellow-50 border-yellow-100 hover:border-yellow-300',
    titleColor: 'text-yellow-700',
  },
  {
    to: '/dashboard',
    icon: '📊',
    title: 'Dashboard',
    description: 'Visualize your personal fitness trends',
    color: 'bg-blue-50 border-blue-100 hover:border-blue-300',
    titleColor: 'text-blue-700',
  },
];

const SPORTS = [
  { icon: '🏃', label: 'Running',     rate: '100 pts / km' },
  { icon: '🚶', label: 'Walking',     rate: '50 pts / km' },
  { icon: '🚴', label: 'Cycling',     rate: '25 pts / km' },
  { icon: '🏊', label: 'Swimming',    rate: '15 pts / min' },
  { icon: '🏋️', label: 'Gym',         rate: '5 pts / min' },
  { icon: '👟', label: 'Daily Steps', rate: '1 pt / 100 steps' },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-10">
        <span className="text-6xl">🏆</span>
        <h1 className="mt-4 text-4xl font-extrabold text-gray-900 tracking-tight">
          Fitness Challenge
        </h1>
        <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto">
          Gamify your workouts. Track running, cycling, swimming and more — compete on a unified global leaderboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/leaderboard"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            View Leaderboard
          </Link>
        </div>
      </section>

      {/* Nav Cards */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {NAV_CARDS.map(({ to, icon, title, description, color, titleColor }) => (
            <Link
              key={to}
              to={to}
              className={`border rounded-xl p-5 transition-all duration-200 group ${color}`}
            >
              <span className="text-3xl">{icon}</span>
              <h3 className={`mt-3 font-bold ${titleColor}`}>{title}</h3>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Scoring reference */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Scoring System</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Sport</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Points Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SPORTS.map(({ icon, label, rate }) => (
                <tr key={label} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="font-medium text-gray-700">{label}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-brand-600 font-semibold">{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-5 py-3 text-xs text-gray-400 border-t border-gray-100">
            All points are floored to the nearest integer. Duration sports floor to whole minutes first. Steps floor to nearest 100.
          </p>
        </div>
      </section>
    </div>
  );
}
