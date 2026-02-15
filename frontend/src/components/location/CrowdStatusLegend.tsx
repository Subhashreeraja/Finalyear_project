import type { CrowdLevel } from '../../types/location';

const LEVEL_STYLES: Record<CrowdLevel, { bg: string; label: string }> = {
  low: { bg: 'bg-green-500', label: 'Low crowd' },
  moderate: { bg: 'bg-yellow-500', label: 'Moderate crowd' },
  high: { bg: 'bg-red-500', label: 'High crowd' },
};

export default function CrowdStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-white/95 rounded-lg shadow border border-gray-200">
      <span className="text-sm font-medium text-accent-primary">Zone status</span>
      {(Object.entries(LEVEL_STYLES) as [CrowdLevel, { bg: string; label: string }][]).map(([level, { bg, label }]) => (
        <div key={level} className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${bg}`} aria-hidden />
          <span className="text-sm text-gray-700">{label}</span>
        </div>
      ))}
    </div>
  );
}
