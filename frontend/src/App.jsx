import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LeaderboardPage from './pages/LeaderboardPage';
import DashboardPage from './pages/DashboardPage';
import LogActivityPage from './pages/LogActivityPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <Routes>
            <Route path="/"             element={<HomePage />} />
            <Route path="/register"     element={<RegisterPage />} />
            <Route path="/leaderboard"  element={<LeaderboardPage />} />
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/log-activity" element={<LogActivityPage />} />
          </Routes>
        </main>
        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
          Fitness Challenge &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </BrowserRouter>
  );
}
