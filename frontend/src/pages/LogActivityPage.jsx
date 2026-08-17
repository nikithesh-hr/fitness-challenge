import LogActivityForm from '../components/forms/LogActivityForm';

export default function LogActivityPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">⚡</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Log Activity</h1>
          <p className="mt-1 text-sm text-gray-500">Record your workout and earn points on the leaderboard</p>
        </div>
        <LogActivityForm />
      </div>
    </div>
  );
}
