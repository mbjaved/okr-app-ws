import React, { useState, useRef, useEffect, createContext, useContext } from "react";

interface MenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const MenuContext = createContext<{ closeMenu: () => void }>({ closeMenu: () => {} });

export const Menu: React.FC<MenuProps> = ({ trigger, children, className }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        <span onClick={() => setOpen((prev) => !prev)} style={{ cursor: "pointer" }}>
          {trigger}
        </span>
        {open && (
          <div
            className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50"
            style={{ minWidth: 120 }}
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
