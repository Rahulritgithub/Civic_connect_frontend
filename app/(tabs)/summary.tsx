import React from 'react';
import LayoutWithNav from '@/components/LayoutWithNav';
import ViewScreen from '@/components/SummaryScreen';
import SummaryScreen from '@/components/SummaryScreen';

export default function summary() {
  return (
    <LayoutWithNav>
      <SummaryScreen />
    </LayoutWithNav>
  );
}