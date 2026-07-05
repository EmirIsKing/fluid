'use client';

import React from 'react';
import RootLayout from '@/src/routes/__root';
import Overview from '@/src/routes/index';
import { OutletProvider } from '@/src/routes/router-mock';

export default function OverviewPage() {
  return (
    <RootLayout>
      <OutletProvider value={<Overview />}>
        <Overview />
      </OutletProvider>
    </RootLayout>
  );
}
