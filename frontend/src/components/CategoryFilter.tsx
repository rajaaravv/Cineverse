import React from 'react';
import { Category } from '../types';
import { cleanCategory } from '../api/channels';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  totalChannels?: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = React.memo(({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar font-sans scroll-smooth touch-pan-x">
      {/* All Channels default */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`shrink-0 cursor-pointer select-none rounded-lg px-3 sm:px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
          !selectedCategory
            ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
            : 'bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        All Channels
      </button>

      {categories.map((cat) => {
        const isSelected = Boolean(
          selectedCategory &&
          (selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
           cleanCategory(selectedCategory) === cleanCategory(cat.name))
        );
        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onSelectCategory(isSelected ? null : cat.name)}
            className={`shrink-0 cursor-pointer select-none rounded-lg px-3 sm:px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                : 'bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <span>{cat.name}</span>
            {cat.channelCount !== undefined && (
              <span className={`ml-1.5 text-[10px] font-mono ${isSelected ? 'text-primary-foreground opacity-90' : 'text-muted-foreground'}`}>
                {cat.channelCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
