'use client';

import React from 'react';
import RootLayout from '@/src/routes/__root';
import Settings from '@/src/routes/settings';
import { OutletProvider } from '@/src/routes/router-mock';

export default function SettingsPage() {
  return (
    <RootLayout>
      <OutletProvider value={<Settings />}>
        <Settings />
      </OutletProvider>
    </RootLayout>
  );
}
