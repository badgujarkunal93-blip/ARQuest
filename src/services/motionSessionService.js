const STORAGE_KEY = 'arquest-sessions';

function readSessions() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Unable to read local motion sessions:', error);
    return [];
  }
}

function writeSessions(sessions) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function sortSessions(sessions) {
  return [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const motionSessionService = {
  async createSession(session) {
    const record = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...session,
    };
    const sessions = sortSessions([record, ...readSessions()]);
    writeSessions(sessions);
    return record;
  },

  async getSessions(limit = 10) {
    return sortSessions(readSessions()).slice(0, limit);
  },

  async getTotalStats() {
    return readSessions().reduce(
      (totals, session) => ({
        totalSessions: totals.totalSessions + 1,
        totalReps: totals.totalReps + (session.total_reps || 0),
        totalPerfectReps: totals.totalPerfectReps + (session.perfect_reps || 0),
        totalDuration: totals.totalDuration + (session.duration_seconds || 0),
        totalXp: totals.totalXp + (session.xp_earned || 0),
      }),
      {
        totalSessions: 0,
        totalReps: 0,
        totalPerfectReps: 0,
        totalDuration: 0,
        totalXp: 0,
      }
    );
  },
};