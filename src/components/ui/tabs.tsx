// src/components/ui/tabs.tsx
// Best Practices: Accessible, modular, shadcn/ui-inspired
import * as React from "react";
import { ReactNode, ReactElement, HTMLAttributes } from "react";

// Best_Practices.md: Typed API contracts, robust modularity
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  className?: string;
  children: ReactNode;
}
export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children }: TabsProps) {
  const isControlled = controlledValue !== undefined && onValueChange !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = isControlled ? controlledValue : uncontrolledValue;
  const setValue = (val: string) => {
    console.debug('[Tabs] setValue called with:', val);
    if (isControlled && onValueChange) onValueChange(val);
    else setUncontrolledValue(val);
  };
  console.debug('[Tabs] Render, value:', value, 'isControlled:', isControlled);
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const element = child as ReactElement<any>;
        if (element.type && (element.type as any).name === 'TabsTrigger') {
          // Pass value (the tab's value) and selectedValue (the current tab)
          return React.cloneElement(element, {
            value: element.props.value,
            selectedValue: value,
            setValue
          });
        }
        // Only pass value to TabsContent; TabsList gets nothing extra
        if (element.type && (element.type as any).name === 'TabsContent') {
          return React.cloneElement(element, { value });
        }
        return element;
      })}
    </div>
  );
}


// Best_Practices.md: Typed API contracts, modularity
interface TabsListProps {
  children: ReactNode;
}
export function TabsList({ children }: TabsListProps) {
  return <div className="flex gap-2 border-b mb-2">{children}</div>;
}


// Best_Practices.md: Typed API contracts, clarity, accessibility
// Best_Practices.md: Typed API contracts, clarity, accessibility
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  setValue?: (val: string) => void;
  selectedValue?: string;
  children: ReactNode;
}
export function TabsTrigger({ value, setValue, selectedValue, children, ...rest }: TabsTriggerProps) {
  const isActive = selectedValue === value;
  // Debug log for click and render
  React.useEffect(() => {
    console.debug('[TabsTrigger] Render', { value, selectedValue, isActive });
  }, [value, selectedValue, isActive]);
  return (
    <button
      id={`tab-${value}`}
      className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${isActive ? "border-blue-600 text-blue-600 bg-blue-50" : "border-transparent text-gray-600 hover:text-blue-600"}`}
      onClick={() => {
        console.debug('[TabsTrigger] onClick', value);
        if (typeof setValue === 'function') setValue(value);
      }}
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      type="button"
      {...rest}
    >
      {children}
      {isActive && <span className="sr-only">(selected)</span>}
    </button>
  );
}


// Best_Practices.md: Typed API contracts, modularity
// Best_Practices.md: Typed API contracts, modularity, accessibility
interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}
export function TabsContent({ value, children, ...rest }: TabsContentProps) {
  // value prop is injected by Tabs parent for controlled tab switching
  // Only render content if this panel's value matches
  const context = React.useContext(TabsContentContext);
  const activeValue = context?.activeValue ?? value;
  if (activeValue !== value) return null;
  return <div {...rest}>{children}</div>;
}

// For future extensibility: a context for TabsContent (not strictly required for current impl)
const TabsContentContext = React.createContext<{ activeValue?: string } | undefined>(undefined);

