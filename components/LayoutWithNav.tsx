import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import BottomNavBar from './BottomNavBar';

interface LayoutWithNavProps {
  children: React.ReactNode;
}

export default function LayoutWithNav({ children }: LayoutWithNavProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          {children}
        </View>
        <BottomNavBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});