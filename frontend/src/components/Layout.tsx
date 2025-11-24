import React from 'react';
import AppSidebar from './AppSidebar';
import { cn } from '@/lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden"
    )}>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

