import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface NavItem {
  name: string;
  icon: string;
  route: string;
}

const navItems: NavItem[] = [
  {
    name: 'Post',
    icon: 'create-outline',
    route: '/post',
  },
  {
    name: 'View',
    icon: 'eye-outline',
    route: '/view',
  },
  {
    name: 'Summary',
    icon: 'stats-chart-outline',
    route: '/summary',
  },
];

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => pathname === route;

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={[styles.navItem, isActive(item.route) && styles.activeNavItem]}
          onPress={() => router.push(item.route as any)}
        >
          <Ionicons
            name={item.icon as any}
            size={24}
            color={isActive(item.route) ? '#007AFF' : '#8E8E93'}
          />
          <Text
            style={[
              styles.navText,
              isActive(item.route) && styles.activeNavText,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    // You can add active background color if needed
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#8E8E93',
  },
  activeNavText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});