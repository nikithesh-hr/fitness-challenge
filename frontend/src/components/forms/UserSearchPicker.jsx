import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRecentUsers } from '../../hooks/useRecentUsers';
import { useUserSearch } from '../../hooks/useUserSearch';
import { registerUser } from '../../api/userApi';

export default function UserSearchPicker({ onSelect, showRegister = true }) {
  const queryClient = useQueryClient();

  // 'searching' | 'selected' | 'registering'
  const [mode, setMode] = useState('searching');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [registerForm, setRegisterForm] = useState({ firstName: '', lastName: '', email: '' });
  const [registerErrors, setRegisterErrors] = useState({});

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const isFiltering = query.trim().length >= 2;
  const { data: recentUsers = [], isLoading: loadingRecent } = useRecentUsers();
  const { data: searchResults = [], isLoading: loadingSearch } = useUserSearch(query);

  const defaultList = recentUsers;
  const displayList = isFiltering ? searchResults : defaultList;
  const isLoading = isFiltering ? loadingSearch : loadingRecent;
  const noResults = !isLoading && displayList.length === 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleFocus() {
    setOpen(true);
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    setOpen(true);
    if (mode === 'registering') setMode('searching');
  }

  function handleSelect(user) {
    setSelectedUser(user);
    setMode('selected');
    setOpen(false);
    setQuery('');
    onSelect(user);
  }

  function handleChange() {
    setMode('searching');
    setSelectedUser(null);
    setQuery('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const newUser = {
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };
      handleSelect(newUser);
      setMode('selected');
      setRegisterForm({ firstName: '', lastName: '', email: '' });
    },
    onError: (err) => {
      if (err.errors) {
        const map = {};
        err.errors.forEach(({ field, message }) => { map[field] = message; });
        setRegisterErrors(map);
      } else if (err.status === 409) {
        const msg = err.message ?? 'Already exists.';
        if (msg.toLowerCase().includes('email')) {
          setRegisterErrors({ email: msg });
        } else {
          setRegisterErrors({ firstName: msg });
        }
      }
    },
  });

  function handleRegisterSubmit(e) {
    e.preventDefault();
    setRegisterErrors({});
    registerMutation.mutate(registerForm);
  }

  function setRegField(key, val) {
    setRegisterForm((f) => ({ ...f, [key]: val }));
    setRegisterErrors((e) => ({ ...e, [key]: undefined }));
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select User
      </label>

      {/* Selected badge */}
      {mode === 'selected' && selectedUser ? (
        <div className="flex items-center justify-between border border-brand-300 bg-brand-50 rounded-lg px-4 py-2.5">
          <div>
            <p className="text-sm font-semibold text-brand-800">
              {selectedUser.firstName} {selectedUser.lastName}
            </p>
            <p className="text-xs text-brand-600">{selectedUser.email}</p>
          </div>
          <button
            type="button"
            onClick={handleChange}
            className="text-xs text-brand-600 hover:text-brand-800 border border-brand-200 bg-white px-2 py-1 rounded transition-colors ml-4 shrink-0"
          >
            Change
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder="Search by name or email…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition"
          autoComplete="off"
        />
      )}

      {/* Dropdown */}
      {open && mode !== 'selected' && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {isLoading && (
            <p className="px-4 py-3 text-xs text-gray-400">Loading users…</p>
          )}

          {!isLoading && displayList.map((user) => (
            <button
              key={user.userId}
              type="button"
              onMouseDown={() => handleSelect(user)}
              className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-semibold text-gray-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </button>
          ))}

          {!isFiltering && defaultList.length > 0 && (
            <p className="px-4 py-2.5 text-xs text-gray-400 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              Type to search all users
            </p>
          )}

          {noResults && !isFiltering && (
            <p className="px-4 py-3 text-xs text-gray-400">No users registered yet.</p>
          )}

          {noResults && isFiltering && (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 mb-2">
                No user found for <span className="font-semibold">"{query}"</span>
              </p>
              {showRegister && (
                <button
                  type="button"
                  onMouseDown={() => { setOpen(false); setMode('registering'); }}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium underline"
                >
                  + Register new user
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline register form */}
      {mode === 'registering' && showRegister && (
        <div className="mt-3 border border-brand-200 bg-brand-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-brand-700">Register New User</p>
            <button
              type="button"
              onClick={() => setMode('searching')}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          {registerMutation.error && !registerMutation.error.errors && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {registerMutation.error.message}
            </p>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-2">
            <InlineField
              label="First Name" value={registerForm.firstName}
              onChange={(v) => setRegField('firstName', v)} error={registerErrors.firstName}
            />
            <InlineField
              label="Last Name" value={registerForm.lastName}
              onChange={(v) => setRegField('lastName', v)} error={registerErrors.lastName}
            />
            <InlineField
              label="Email" type="email" value={registerForm.email}
              onChange={(v) => setRegField('email', v)} error={registerErrors.email}
            />
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg transition-colors mt-1"
            >
              {registerMutation.isPending ? 'Registering…' : 'Create & Select'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function InlineField({ label, value, onChange, error, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-0.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={`w-full border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
        }`}
      />
      {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
