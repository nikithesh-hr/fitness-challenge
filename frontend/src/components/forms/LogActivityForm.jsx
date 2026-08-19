import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logActivity } from '../../api/activityApi';
import UserSearchPicker from './UserSearchPicker';

const SPORTS = ['RUNNING', 'WALKING', 'CYCLING', 'GYM', 'SWIMMING', 'DAILY_STEPS'];
const DISTANCE_SPORTS = ['RUNNING', 'WALKING', 'CYCLING'];
const DURATION_SPORTS = ['GYM', 'SWIMMING'];
const MAX_DAILY_STEPS = 100_000;
const MAX_DISTANCE_KM = 1000;
const MAX_DISTANCE_DECIMALS = 3;
const MAX_DURATION_MINUTES = 1440;
const MAX_DURATION_SECONDS = 59;
const MAX_DURATION_TOTAL_SECONDS = 24 * 60 * 60;

function todayLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function LogActivityForm() {
  const queryClient = useQueryClient();

  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const [form, setForm] = useState({
    userId: '',
    sport: 'RUNNING',
    distanceKm: '',
    durationMinutes: '',
    durationSeconds: '',
    stepCount: '',
    notes: '',
    recordedAt: todayLocal(),
  });
  const [extraFields, setExtraFields] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const mutation = useMutation({
    mutationFn: ({ payload, key }) => logActivity(payload, key),
    onSuccess: (data) => {
      setSuccessMsg(`🎉 You earned ${data.pointsAwarded} points!`);
      setIdempotencyKey(crypto.randomUUID());
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err) => {
      if (err.errors) {
        const map = {};
        err.errors.forEach(({ field, message }) => { map[field] = message; });
        setFieldErrors(map);
      }
    },
  });

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  function setDistanceKm(raw) {
    if (raw === '') {
      set('distanceKm', '');
      return;
    }
    let next = raw;
    if (next.startsWith('.')) next = `0${next}`;
    const n = parseFloat(next);
    if (Number.isNaN(n)) return;
    if (n < 0) {
      set('distanceKm', '0');
      return;
    }
    if (n > MAX_DISTANCE_KM) {
      set('distanceKm', String(MAX_DISTANCE_KM));
      return;
    }
    const dot = next.indexOf('.');
    if (dot !== -1) {
      const whole = next.slice(0, dot);
      const frac = next.slice(dot + 1, dot + 1 + MAX_DISTANCE_DECIMALS);
      next = `${whole}.${frac}`;
    }
    set('distanceKm', next);
  }

  function clampInt(raw, min, max) {
    if (raw === '') return '';
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return null;
    return Math.min(Math.max(n, min), max);
  }

  function setDurationMinutes(raw) {
    const clamped = clampInt(raw, 0, MAX_DURATION_MINUTES);
    if (clamped === null) return;
    setForm((f) => {
      const minutes = clamped === '' ? 0 : clamped;
      let seconds = parseInt(f.durationSeconds, 10) || 0;
      if (minutes * 60 + seconds > MAX_DURATION_TOTAL_SECONDS) {
        seconds = 0;
      }
      return {
        ...f,
        durationMinutes: clamped === '' ? '' : String(clamped),
        durationSeconds: f.durationSeconds === '' && seconds === 0 ? f.durationSeconds : String(seconds),
      };
    });
    setFieldErrors((e) => ({ ...e, durationMinutes: undefined }));
  }

  function setDurationSeconds(raw) {
    const clamped = clampInt(raw, 0, MAX_DURATION_SECONDS);
    if (clamped === null) return;
    setForm((f) => {
      const minutes = parseInt(f.durationMinutes, 10) || 0;
      let seconds = clamped === '' ? 0 : clamped;
      if (minutes * 60 + seconds > MAX_DURATION_TOTAL_SECONDS) {
        seconds = 0;
      }
      return {
        ...f,
        durationSeconds: clamped === '' ? '' : String(seconds),
      };
    });
    setFieldErrors((e) => ({ ...e, durationMinutes: undefined }));
  }

  function addExtraField() {
    setExtraFields((f) => [...f, { key: '', value: '' }]);
  }

  function updateExtra(i, prop, val) {
    setExtraFields((f) => f.map((item, idx) => idx === i ? { ...item, [prop]: val } : item));
  }

  function removeExtra(i) {
    setExtraFields((f) => f.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMsg('');

    if (!form.userId) {
      setFieldErrors({ userId: 'Please select a user before logging an activity.' });
      return;
    }

    const extra = {};
    extraFields.forEach(({ key, value }) => { if (key.trim()) extra[key.trim()] = value; });

    const payload = {
      userId: form.userId,
      sport: form.sport,
      recordedAt: form.recordedAt ? (form.recordedAt + ':00').slice(0, 19) : undefined,
      notes: form.notes || undefined,
      extraFields: extra,
    };

    if (DISTANCE_SPORTS.includes(form.sport)) {
      const distanceKm = parseFloat(form.distanceKm);
      if (Number.isNaN(distanceKm) || distanceKm <= 0 || distanceKm > MAX_DISTANCE_KM) {
        setFieldErrors({ distanceKm: `Distance must be between 0.001 and ${MAX_DISTANCE_KM} km.` });
        return;
      }
      payload.distanceKm = parseFloat(form.distanceKm);
    } else if (DURATION_SPORTS.includes(form.sport)) {
      const minutes = parseInt(form.durationMinutes, 10) || 0;
      const seconds = parseInt(form.durationSeconds, 10) || 0;
      if (minutes < 0 || minutes > MAX_DURATION_MINUTES
          || seconds < 0 || seconds > MAX_DURATION_SECONDS
          || (minutes * 60 + seconds) > MAX_DURATION_TOTAL_SECONDS) {
        setFieldErrors({ durationMinutes: 'Duration must be between 0 and 24 hours.' });
        return;
      }
      payload.durationMinutes = minutes;
      payload.durationSeconds = seconds;
    } else {
      const steps = parseInt(form.stepCount, 10);
      if (!Number.isInteger(steps) || steps < 1 || steps > MAX_DAILY_STEPS) {
        setFieldErrors({ stepCount: `Step count must be between 1 and ${MAX_DAILY_STEPS.toLocaleString()}.` });
        return;
      }
      payload.stepCount = steps;
    }

    mutation.mutate({ payload, key: idempotencyKey });
  }

  const isDistance = DISTANCE_SPORTS.includes(form.sport);
  const isDuration = DURATION_SPORTS.includes(form.sport);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm font-medium">
          {successMsg}
        </div>
      )}

      {mutation.error && !mutation.error.errors && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {mutation.error.message ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      {/* User Search */}
      <UserSearchPicker
        showRegister
        onSelect={(user) => set('userId', user.userId)}
      />
      {fieldErrors.userId && (
        <p className="text-xs text-red-600 -mt-3">{fieldErrors.userId}</p>
      )}

      {/* Sport */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
        <select
          value={form.sport}
          onChange={(e) => set('sport', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition bg-white"
        >
          {SPORTS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Metric — dynamic based on sport */}
      {isDistance && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
          <input
            type="number"
            min="0.001"
            max={MAX_DISTANCE_KM}
            step="0.001"
            value={form.distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            required
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition ${fieldErrors.distanceKm ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          />
          <p className="mt-1 text-xs text-gray-400">Maximum 1,000 km, up to 3 decimal places</p>
          {fieldErrors.distanceKm && <p className="mt-1 text-xs text-red-600">{fieldErrors.distanceKm}</p>}
        </div>
      )}

      {isDuration && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max={MAX_DURATION_MINUTES}
                value={form.durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
                placeholder="Minutes"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition ${fieldErrors.durationMinutes ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {fieldErrors.durationMinutes && <p className="mt-1 text-xs text-red-600">{fieldErrors.durationMinutes}</p>}
            </div>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max={MAX_DURATION_SECONDS}
                value={form.durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="Seconds (0–59)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-400">Maximum 24 hours (1,440 minutes)</p>
        </div>
      )}

      {form.sport === 'DAILY_STEPS' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Step Count</label>
          <input
            type="number"
            min="1"
            max={MAX_DAILY_STEPS}
            step="1"
            value={form.stepCount}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                set('stepCount', '');
                return;
              }
              const n = parseInt(raw, 10);
              if (Number.isNaN(n)) return;
              set('stepCount', String(Math.min(Math.max(n, 0), MAX_DAILY_STEPS)));
            }}
            required
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition ${fieldErrors.stepCount ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          />
          <p className="mt-1 text-xs text-gray-400">Maximum 100,000 steps (about a full extreme day)</p>
          {fieldErrors.stepCount && <p className="mt-1 text-xs text-red-600">{fieldErrors.stepCount}</p>}
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time</label>
        <input
          type="datetime-local"
          value={form.recordedAt}
          onChange={(e) => set('recordedAt', e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
        />
      </div>

      {/* Extra Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Extra Fields <span className="text-gray-400 font-normal">(any key-value data)</span></label>
          <button
            type="button"
            onClick={addExtraField}
            className="text-xs text-brand-600 hover:text-brand-800 border border-brand-200 px-2 py-1 rounded transition-colors"
          >
            + Add Field
          </button>
        </div>
        {extraFields.length === 0 && (
          <p className="text-xs text-gray-400">No extra fields. Click "+ Add Field" to attach custom metadata.</p>
        )}
        <div className="space-y-2">
          {extraFields.map((ef, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Key"
                value={ef.key}
                onChange={(e) => updateExtra(i, 'key', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <input
                type="text"
                placeholder="Value"
                value={ef.value}
                onChange={(e) => updateExtra(i, 'value', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <button
                type="button"
                onClick={() => removeExtra(i)}
                className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none"
                aria-label="Remove field"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {mutation.isPending ? 'Logging…' : 'Log Activity'}
      </button>
    </form>
  );
}
