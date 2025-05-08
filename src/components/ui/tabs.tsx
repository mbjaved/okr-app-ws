// src/components/ui/tabs.tsx
// Best Practices: Accessible, modular, shadcn/ui-inspired
import * as React from "react";

export function Tabs({ defaultValue, className, children }: any) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, setValue })
      )}
    </div>
  );
}

export function TabsList({ children }: any) {
  return <div className="flex gap-2 border-b mb-2">{children}</div>;
}

export function TabsTrigger({ value: tabValue, setValue, value, children }: any) {
  const isActive = value === tabValue;
  return (
    <button
      className={`px-4 py-2 font-medium border-b-2 transition-colors ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-blue-600"}`}
      onClick={() => setValue(tabValue)}
      aria-selected={isActive}
      tabIndex={0}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value: tabValue, value, children }: any) {
  if (value !== tabValue) return null;
  return <div>{children}</div>;
}
