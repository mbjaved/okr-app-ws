// src/components/ui/tabs.tsx
// Best Practices: Accessible, modular, shadcn/ui-inspired
import * as React from "react";

// Best_Practices.md: Only pass setValue to TabsTrigger for robust modularity
// Best_Practices.md: Support both controlled and uncontrolled Tabs for modularity and robust UI feedback
export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children }: any) {
  const isControlled = controlledValue !== undefined && onValueChange !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = isControlled ? controlledValue : uncontrolledValue;
  const setValue = isControlled ? onValueChange : setUncontrolledValue;
  return (
    <div className={className}>
      {React.Children.map(children, child => {
  if (child.type && child.type.name === 'TabsTrigger') {
    // Pass tabValue (the value for this tab) and selectedValue (the current tab)
    return React.cloneElement(child, {
      tabValue: child.props.value,
      selectedValue: value,
      setValue
    });
  }
  // Only pass value to TabsContent; TabsList gets nothing extra
  if (child.type && child.type.name === 'TabsContent') {
    return React.cloneElement(child, { value });
  }
  return child;
})}
    </div>
  );
}

export function TabsList({ children }: any) {
  return <div className="flex gap-2 border-b mb-2">{children}</div>;
}

// Best_Practices.md: Use unique prop names for clarity and accessibility
export function TabsTrigger({ tabValue, setValue, selectedValue, children }: any) {
  const isActive = selectedValue === tabValue;
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
