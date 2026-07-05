'use client';

import React, { createContext, useContext } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Create a context to hold the children/page to render inside `<Outlet />`
const OutletContext = createContext<React.ReactNode>(null);

export function Outlet() {
  const content = useContext(OutletContext);
  return <>{content}</>;
}

export function OutletProvider({ children, value }: { children: React.ReactNode; value: React.ReactNode }) {
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
}

// Compatibility Link that translates `to` to `href` and resolves `activeProps` class names/styles
export function Link({
  to,
  activeProps,
  className = '',
  children,
  ...props
}: {
  to: string;
  activeProps?: { className?: string; style?: React.CSSProperties };
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) {
  const pathname = usePathname();
  
  // Custom active matching logic
  const isActive = pathname === to || (to !== '/' && pathname?.startsWith(to));
  
  const activeClass = isActive && activeProps?.className ? activeProps.className : '';
  const activeStyle = isActive && activeProps?.style ? activeProps.style : {};
  
  const combinedClassName = `${className} ${activeClass}`.trim();
  const currentStyle = { ...props.style, ...activeStyle };

  return (
    <NextLink href={to} className={combinedClassName} style={currentStyle} {...props}>
      {children}
    </NextLink>
  );
}

// Compatibility useNavigate hook
export function useNavigate() {
  const router = useRouter();
  return (options: { to: string } | string) => {
    const dest = typeof options === 'string' ? options : options.to;
    router.push(dest);
  };
}
