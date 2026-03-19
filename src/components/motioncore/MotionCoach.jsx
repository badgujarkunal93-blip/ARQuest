import { Bot, Volume2, VolumeX, Zap } from 'lucide-react';
import Card from '@/components/ui/Card';

export default function MotionCoach({
  exerciseLabel,
  formAnalysis,
  repState,
  ghostMatch,
  voiceEnabled,
  voiceSupported,
}) {
  const directive = repState?.coachMessage || formAnalysis?.primaryFeedback || 'Awaiting live movement...';
  const fatigueLabel = repState?.fatigueLabel || 'Maintain pace';
  const tempoLabel = repState?.currentTempo || 'steady';

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot size={16} style={{ color: 'var(--color-accent)' }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
          Motion Coach
        </h3>
      </div>

      <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(5, 15, 23, 0.76)' }}>
        <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'var(--color-accent)' }}>
          Live directive
        </p>
        <p className="mt-3 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          {directive}
        </p>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-text-muted)' }}>
          Coaching {exerciseLabel.toLowerCase()} form with rep timing, fatigue drift, and ghost alignment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--color-accent)' }}>
            Tempo read
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {tempoLabel === 'slowing' ? 'Speed dropping' : tempoLabel === 'watch' ? 'Slight slowdown' : 'Locked rhythm'}
          </p>
          <p className="mt-2 text-xs leading-5" style={{ color: 'var(--color-text-muted)' }}>
            {fatigueLabel}
          </p>
        </div>

        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--color-accent)' }}>
            Voice coaching
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {voiceSupported ? (voiceEnabled ? 'Voice online' : 'Voice muted') : 'Speech unavailable'}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            {voiceEnabled ? 'Rep calls and fatigue warnings are active.' : 'Visual coaching only.'}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(7, 22, 31, 0.68)' }}>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--color-accent)' }}>
          <Zap size={12} />
          Alignment intelligence
        </div>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-text)' }}>
          {ghostMatch?.feedback || 'Ghost alignment waiting...'}
        </p>
        <p className="mt-2 text-xs leading-5" style={{ color: 'var(--color-text-muted)' }}>
          Match score {ghostMatch?.score ?? 0}% with current form score {formAnalysis?.score ?? 0}%.
        </p>
      </div>
    </Card>
  );
}
