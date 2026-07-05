'use client';

import React from 'react';
import RootLayout from '@/src/routes/__root';
import Networks from '@/src/routes/networks';
import { OutletProvider } from '@/src/routes/router-mock';

export default function NetworksPage() {
  return (
    <RootLayout>
      <OutletProvider value={<Networks />}>
        <Networks />
      </OutletProvider>
    </RootLayout>
  );
}
