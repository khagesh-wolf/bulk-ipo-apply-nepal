import { Tabs } from 'expo-router';
import { LayoutDashboard, TrendingUp, Briefcase, BarChart2, Settings } from '@blinkdotnew/mobile-ui';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1221',
          borderTopColor: '#1A2744',
          borderTopWidth: 1,
          height: 64,
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#4A5568',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginBottom: 6,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ipo"
        options={{
          title: 'IPO',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <Briefcase size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
