'use client';

import React from 'react';
import RootLayout from '@/src/routes/__root';
import Balances from '@/src/routes/balances';
import { OutletProvider } from '@/src/routes/router-mock';

export default function BalancesPage() {
  return (
    <RootLayout>
      <OutletProvider value={<Balances />}>
        <Balances />
      </OutletProvider>
    </RootLayout>
  );
}
