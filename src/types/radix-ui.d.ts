// Type definitions for Radix UI packages
declare module '@radix-ui/react-tabs' {
  import * as React from 'react';

  // Define common props
  type PrimitiveDivProps = React.ComponentPropsWithoutRef<'div'>;
  type TabsRootProps = PrimitiveDivProps & {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
  };

  // Root component
  export const Root: React.FC<TabsRootProps>;
  
  // List component
  export const List: React.FC<PrimitiveDivProps>;
  
  // Trigger component
  type TriggerProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'value'> & {
    value: string;
  };
  export const Trigger: React.FC<TriggerProps>;
  
  // Content component
  type ContentProps = PrimitiveDivProps & {
    value: string;
  };
  export const Content: React.FC<ContentProps>;
}

// Add additional Radix UI component declarations as needed
