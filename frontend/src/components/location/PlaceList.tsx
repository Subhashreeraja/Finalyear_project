import { useState, useMemo } from 'react';
import type { Place } from '../../types/location';

const TYPE_LABELS: Record<Place['type'], string> = {
  railway_station: 'Railway',
  bus_stand: 'Bus Stand',
  temple: 'Temple',
  market: 'Market',
  mall: 'Mall',
  event_ground: 'Event Ground',
  other: 'Other',
};

interface PlaceListProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (place: Place) => void;
}

export default function PlaceList({ places, selectedId, onSelect }: PlaceListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) => p.name.toLowerCase().includes(q) || TYPE_LABELS[p.type].toLowerCase().includes(q));
  }, [places, search]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        placeholder="Search places..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-header focus:border-transparent"
        aria-label="Search places"
      />
      <ul className="space-y-1 overflow-y-auto max-h-[320px]">
        {filtered.length === 0 ? (
          <li className="py-4 text-center text-accent-muted text-sm">No places found</li>
        ) : (
          filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedId === p.id
                    ? 'bg-header text-white'
                    : 'bg-white border border-gray-200 hover:bg-body hover:border-header/30'
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="block text-xs mt-0.5 opacity-90">{TYPE_LABELS[p.type]}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
