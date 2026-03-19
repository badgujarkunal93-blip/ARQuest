import { Clock3, Flame, Sparkles, Trophy } from 'lucide-react';

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="motioncore-stat-card">
      <div className="motioncore-stat-card__icon">
        <Icon size={16} />
      </div>
      <div>
        <p className="motioncore-stat-card__label">{label}</p>
        <p className="motioncore-stat-card__value">{value}</p>
        <p className="motioncore-stat-card__detail">{detail}</p>
      </div>
    </div>
  );
}

export default function MotionStats({
  xpGained,
  motionStreak,
  sessionLabel,
  perfectReps,
  repCount,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <StatCard
        icon={Sparkles}
        label="XP Gained"
        value={`+${xpGained}`}
        detail="Biomech session reward"
      />
      <StatCard
        icon={Flame}
        label="Motion Streak"
        value={`${motionStreak} days`}
        detail="Consecutive days trained in Motion Core"
      />
      <StatCard
        icon={Clock3}
        label="Session Timer"
        value={sessionLabel}
        detail="Live session duration"
      />
      <StatCard
        icon={Trophy}
        label="Perfect Reps"
        value={`${perfectReps}/${repCount || 0}`}
        detail="Perfect form bonus progress"
      />
    </div>
  );
}
