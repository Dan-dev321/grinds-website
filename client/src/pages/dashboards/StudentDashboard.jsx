// client/src/pages/dashboards/StudentDashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDaysIcon,
  ClockIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

// ── helpers ──────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const isUpcoming = (session) => new Date(session.date) >= new Date();
const isPast     = (session) => new Date(session.date) <  new Date();

const statusBadge = (status) => {
  const map = {
    confirmed: 'badge-success',
    pending:   'badge-warning',
    cancelled: 'badge-danger',
    completed: 'badge-brand',
  };
  return map[status] ?? 'badge-brand';
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('en-IE', {
    hour: '2-digit', minute: '2-digit',
  });

// ── sub-components ────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-brand-600' }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`mt-0.5 rounded-lg bg-surface-100 p-2 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SessionRow({ session }) {
  const sessionDate = new Date(session.date);

  return (
    <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-white px-4 py-3 hover:bg-surface-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold leading-tight">
          <span>{sessionDate.toLocaleDateString('en-IE', { day: 'numeric' })}</span>
          <span>{sessionDate.toLocaleDateString('en-IE', { month: 'short' })}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {session.subject ?? 'Session'}
          </p>
          <p className="text-sm text-gray-500">
            {formatTime(session.date)} · {session.duration ?? 60} min
          </p>
        </div>
      </div>
      <span className={`badge ${statusBadge(session.status)}`}>
        {session.status ?? 'booked'}
      </span>
    </div>
  );
}

// ── main component ────────────────────────────────────────
export default function StudentDashboard() {
  const { token } = useAuth();

  const [profile,         setProfile]         = useState(null);
  const [sessions,        setSessions]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [showPast,        setShowPast]        = useState(false);

  // ── fetch on mount ──────────────────────────────────────
  useEffect(() => {
    const headers = authHeaders(token);

    Promise.all([
      fetch(`${API}/api/students/me`,     { headers }).then((r) => r.json()),
      fetch(`${API}/api/sessions/mine`,   { headers }).then((r) => r.json()),
    ])
      .then(([profileData, sessionData]) => {
        setProfile(profileData);
        setSessions(Array.isArray(sessionData) ? sessionData : []);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, [token]);

  // ── derived state ───────────────────────────────────────
  const upcoming = sessions.filter(isUpcoming);
  const past     = sessions.filter(isPast).reverse(); // most-recent-past first
  const nextSession = upcoming[0] ?? null;

  const stats = {
    upcoming:  upcoming.length,
    total:     sessions.length,
    completed: past.filter((s) => s.status === 'completed').length,
    subjects:  [...new Set(sessions.map((s) => s.subject).filter(Boolean))].length,
  };

  // ── render ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-500 space-y-2">
          <p className="font-semibold">{error}</p>
          <button className="btn-secondary text-sm" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-container space-y-8">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Workspace: <span className="font-medium text-brand-700">
                {profile?.tutor?.businessName ?? profile?.tutor?.name ?? '—'}
              </span>
            </p>
          </div>

          {/* Next session pill */}
          {nextSession && (
            <div className="flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-4 py-2 text-sm text-brand-700">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>
                Next: <strong>{formatDate(nextSession.date)}</strong> at {formatTime(nextSession.date)}
              </span>
            </div>
          )}
        </div>

        {/* ── Stat cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={CalendarDaysIcon}
            label="Upcoming"
            value={stats.upcoming}
            sub="sessions booked"
          />
          <StatCard
            icon={CheckCircleIcon}
            label="Completed"
            value={stats.completed}
            color="text-green-600"
            sub="sessions done"
          />
          <StatCard
            icon={ClockIcon}
            label="Total sessions"
            value={stats.total}
            color="text-violet-600"
            sub="all time"
          />
          <StatCard
            icon={AcademicCapIcon}
            label="Subjects"
            value={stats.subjects || '—'}
            color="text-amber-600"
            sub="being studied"
          />
        </div>

        {/* ── Upcoming sessions ───────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Upcoming Sessions
          </h2>

          {upcoming.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <CalendarDaysIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No upcoming sessions booked yet.</p>
              <p className="text-xs mt-1">Contact your tutor to schedule one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((s) => (
                <SessionRow key={s._id} session={s} />
              ))}
            </div>
          )}
        </section>

        {/* ── Past sessions (collapsed) ───────────────────── */}
        {past.length > 0 && (
          <section>
            <button
              onClick={() => setShowPast((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-3"
            >
              {showPast
                ? <ChevronUpIcon className="h-4 w-4" />
                : <ChevronDownIcon className="h-4 w-4" />}
              {showPast ? 'Hide' : 'Show'} past sessions ({past.length})
            </button>

            {showPast && (
              <div className="space-y-2 opacity-80">
                {past.map((s) => (
                  <SessionRow key={s._id} session={s} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Profile summary card ────────────────────────── */}
        <section className="card">
          <div className="flex items-center gap-2 mb-4">
            <UserCircleIcon className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-semibold text-gray-900">My Profile</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            {[
              { label: 'Full name',   value: profile?.name },
              { label: 'Email',       value: profile?.email },
              { label: 'Phone',       value: profile?.phone        || '—' },
              { label: 'School',      value: profile?.school       || '—' },
              { label: 'Year group',  value: profile?.yearGroup    || '—' },
              { label: 'Exam board',  value: profile?.examBoard    || '—' },
              { label: 'Subjects',    value: profile?.subjects?.join(', ') || '—' },
              { label: 'Member since', value: profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })
                  : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
                <span className="text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {profile?.goals && (
            <div className="mt-4 rounded-lg bg-surface-50 border border-surface-200 p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Goals</p>
              <p className="text-sm text-gray-700">{profile.goals}</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default StudentDashboard