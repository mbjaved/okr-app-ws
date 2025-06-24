// Accessible, reusable Table components for Teams page
// Best Practice: Follows design system, accessibility, and modularity
import React from "react";

export const Table = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <table className={`min-w-full divide-y divide-gray-200 ${className}`}>{children}</table>
);

export const TableHead = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <thead className={`bg-gray-50 ${className}`}>{children}</thead>
);

export const TableRow = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <tr className={`hover:bg-gray-100 focus-within:bg-gray-100 ${className}`}>{children}</tr>
);

export const TableCell = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <td className={`px-4 py-2 whitespace-nowrap text-sm text-gray-700 ${className}`}>{children}</td>
);

export const TableBody = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <tbody className={className}>{children}</tbody>
);
