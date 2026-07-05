'use client';

import React from 'react';
import RootLayout from '@/src/routes/__root';
import Send from '@/src/routes/send';
import { OutletProvider } from '@/src/routes/router-mock';

export default function SendPage() {
  return (
    <RootLayout>
      <OutletProvider value={<Send />}>
        <Send />
      </OutletProvider>
    </RootLayout>
  );
}
