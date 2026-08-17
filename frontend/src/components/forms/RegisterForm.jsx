import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerUser } from '../../api/userApi';

export default function RegisterForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      setForm({ firstName: '', lastName: '', email: '' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      if (err.errors) {
        // 400 — field-level validation errors from the backend
        const map = {};
        err.errors.forEach(({ field, message }) => {
          map[field] = message;
        });
        setFieldErrors(map);
      } else if (err.status === 409) {
        const msg = err.message ?? 'Already exists.';
        if (msg.toLowerCase().includes('email')) {
          setFieldErrors({ email: msg });
        } else {
          setFieldErrors({ firstName: msg });
        }
      }
    },
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: undefined });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    mutation.mutate(form);
  }

  // Only show the top-level banner for unexpected errors (not field errors, not 409)
  const apiError = mutation.error && !mutation.error.errors && mutation.error?.status !== 409
    ? mutation.error.message
    : null;

  if (mutation.isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-5 py-6 text-center space-y-3">
        <p className="text-lg font-semibold">Registration Successful!</p>
        <p className="text-sm">Your account has been created. You can now log activities and view your dashboard.</p>
        <button
          onClick={() => mutation.reset()}
          className="mt-2 text-sm text-green-700 underline hover:text-green-900"
        >
          Register another user
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {apiError}
        </div>
      )}

      <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} error={fieldErrors.firstName} />
      <Field label="Last Name"  name="lastName"  value={form.lastName}  onChange={handleChange} error={fieldErrors.lastName} />
      <Field label="Email"      name="email"      value={form.email}     onChange={handleChange} error={fieldErrors.email} type="email" />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {mutation.isPending ? 'Registering…' : 'Create Account'}
      </button>
    </form>
  );
}

function Field({ label, name, value, onChange, error, type = 'text' }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
