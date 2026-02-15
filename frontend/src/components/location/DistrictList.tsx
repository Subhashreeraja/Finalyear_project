import { useState, useMemo } from 'react';
import type { District } from '../../types/location';

interface DistrictListProps {
  districts: District[];
  selectedId: string | null;
  onSelect: (district: District) => void;
}

const PLACEHOLDER = 'Search districts...';

export default function DistrictList({ districts, selectedId, onSelect }: DistrictListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return districts;
    return districts.filter((d) => d.name.toLowerCase().includes(q));
  }, [districts, search]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        placeholder={PLACEHOLDER}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
        aria-label="Search districts"
      />
      <ul className="space-y-1 overflow-y-auto max-h-[320px]">
        {filtered.length === 0 ? (
          <li className="py-4 text-center text-accent-muted text-sm">No districts found</li>
        ) : (
          filtered.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onSelect(d)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedId === d.id
                    ? 'bg-header text-white'
                    : 'bg-white border border-gray-200 hover:bg-body hover:border-header/30'
                }`}
              >
                <span className="font-medium">{d.name}</span>
                <span className="block text-xs mt-0.5 opacity-90">
                  {d.placeCount} place{d.placeCount !== 1 ? 's' : ''}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
