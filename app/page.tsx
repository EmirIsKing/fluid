'use client';

import React from 'react';
import LandingLayout from '@/src/routes/landing-layout';
import Landing from '@/src/routes/landing';

export default function Home() {
  return (
    <LandingLayout>
      <Landing />
    </LandingLayout>
  );
}
