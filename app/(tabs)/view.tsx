import React from 'react';
import LayoutWithNav from '@/components/LayoutWithNav';
import ViewScreen from '@/components/ViewScreen';

export default function ViewPage() {
  return (
    <LayoutWithNav>
      <ViewScreen />
    </LayoutWithNav>
  );
}