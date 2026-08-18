'use client';

interface FilterChipsProps {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

export default function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`
            flex-shrink-0 px-4 py-1.5
            font-body text-sm rounded-full
            transition-all duration-200
            ${
              selected === option.value
                ? 'bg-green text-white shadow-sm'
                : 'bg-card text-ink-soft border border-ink/10 hover:border-green/40 hover:text-green'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
