import React, { useState, useRef, useEffect, createContext, useContext } from "react";

interface MenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

const MenuContext = createContext<{ closeMenu: () => void }>({ closeMenu: () => {} });

export const Menu: React.FC<MenuProps> = ({ trigger, children, className, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [smartAlign, setSmartAlign] = useState<'left' | 'right' | 'center'>(align);
  
  // Debug logging
  console.log('Menu component - align prop:', align);

  // Smart positioning logic
  useEffect(() => {
    if (open && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = align === 'center' ? 320 : 160;
      
      let optimalAlign = align;
      
      if (align === 'center') {
        // Check if centered dropdown would be cut off
        const centerLeft = triggerRect.left + (triggerRect.width / 2) - (dropdownWidth / 2);
        const centerRight = centerLeft + dropdownWidth;
        
        if (centerLeft < 0) {
          // Would be cut off on left, align to left
          optimalAlign = 'left';
        } else if (centerRight > viewportWidth) {
          // Would be cut off on right, align to right
          optimalAlign = 'right';
        }
      }
      
      console.log('Smart positioning:', {
        originalAlign: align,
        optimalAlign,
        triggerRect,
        viewportWidth,
        dropdownWidth
      });
      
      setSmartAlign(optimalAlign);
    }
  }, [open, align]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <MenuContext.Provider value={{ closeMenu: () => setOpen(false) }}>
      <div className={className} ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
        <span ref={triggerRef} onClick={() => setOpen((prev) => !prev)} style={{ cursor: "pointer" }}>
          {trigger}
        </span>
        {open && (
          <div
            className="absolute mt-2 bg-white border rounded shadow-lg z-50"
            style={{
              minWidth: align === 'center' ? 320 : 120,
              width: align === 'center' ? 320 : 160,
              ...(smartAlign === 'center' ? {
                left: '50%',
                transform: 'translateX(-50%)',
                right: 'auto'
              } : smartAlign === 'left' ? {
                left: 0,
                right: 'auto'
              } : {
                right: 0,
                left: 'auto'
              })
            }}
            data-menu-align={smartAlign}
            ref={(el) => {
              if (el) {
                console.log('Menu dropdown rendered with:', {
                  originalAlign: align,
                  smartAlign,
                  className: el.className,
                  style: el.style.cssText,
                  computedLeft: window.getComputedStyle(el).left,
                  computedRight: window.getComputedStyle(el).right,
                  transform: window.getComputedStyle(el).transform
                });
              }
            }}
          >
            {children}
          </div>
        )}
      </div>
    </MenuContext.Provider>
  );
};

export const MenuItem: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, children, className }) => {
  const { closeMenu } = useContext(MenuContext);
  const handleClick = () => {
    if (onClick) onClick();
    closeMenu(); // Best Practice: Always close menu after action
  };
  return (
    <button
      className={`w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 focus:outline-none ${className || ""}`}
      onClick={handleClick}
      type="button"
    >
      {children}
    </button>
  );
};
