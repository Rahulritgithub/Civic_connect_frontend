import React from 'react';
import LayoutWithNav from '@/components/LayoutWithNav';
import PostScreen from '@/components/PostScreen';

export default function PostPage() {
  return (
    <LayoutWithNav>
      <PostScreen />
    </LayoutWithNav>
  );
}