import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: { name: string; url: string }[];
  onNavigate: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-0">
      <ol className="flex items-center flex-wrap gap-2 text-xs text-gray-500 font-medium">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const path = item.url.replace('https://padaria.io', '') || '/';

          return (
            <li key={index} className="flex items-center space-x-2">
              {index === 0 ? (
                <button
                  onClick={() => onNavigate('/')}
                  className="flex items-center space-x-1 hover:text-[#FF6B00] transition-colors cursor-pointer"
                  title="Página Inicial"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </button>
              ) : isLast ? (
                <span className="text-gray-900 font-bold truncate max-w-[200px] sm:max-w-md" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(path)}
                  className="hover:text-[#FF6B00] transition-colors cursor-pointer truncate max-w-[150px]"
                >
                  {item.name}
                </button>
              )}

              {!isLast && <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
