// Pagination Component (Best_Practices.md, Design_Prompts)
// Modular, accessible, reusable UI component for paging lists and grids
import React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex gap-2 justify-center my-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={`px-2 py-1 rounded border disabled:opacity-50 ${currentPage !== 1 ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300' : 'cursor-default'}`}
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => {
        const isActive = currentPage === i + 1;
        return (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            aria-current={isActive ? "page" : undefined}
            disabled={isActive}
            className={`px-2 py-1 rounded border ${isActive ? 'bg-blue-500 text-white' : 'bg-white'} ${!isActive ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300' : 'cursor-default'}` }
          >
            {i + 1}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={`px-2 py-1 rounded border disabled:opacity-50 ${currentPage !== totalPages ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300' : 'cursor-default'}`}
      >
        Next
      </button>
    </nav>
  );
};
