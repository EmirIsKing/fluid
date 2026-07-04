'use client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ParticleProvider } from '@/components/ParticleProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ParticleProvider>
      <TooltipProvider>
        <Toaster />
        {children}
      </TooltipProvider>
    </ParticleProvider>
  );
}
