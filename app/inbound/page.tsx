'use client';

import React from 'react';
import RootLayout from '@/src/routes/__root';
import Inbound from '@/src/routes/inbound';
import { OutletProvider } from '@/src/routes/router-mock';

export default function InboundPage() {
  return (
    <RootLayout>
      <OutletProvider value={<Inbound />}>
        <Inbound />
      </OutletProvider>
    </RootLayout>
  );
}
