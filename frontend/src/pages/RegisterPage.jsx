import RegisterForm from '../components/forms/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">🏅</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-1 text-sm text-gray-500">Join the fitness challenge and start earning points</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
