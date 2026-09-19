import React from 'react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  totalChannels?: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar font-sans">
      {/* All Channels default */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
          selectedCategory === null
            ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
            : 'bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        All Channels
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
        return (
          <button
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                : 'bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};
