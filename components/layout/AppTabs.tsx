import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useChatContext } from '~/context/ChatContext';
import { useCurrentUser } from '~/lib/queries/useCurrentUser';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={25} {...props} />;
}

interface NotificationBadgeProps {
  count: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

function CenterTabButton({ children, color }: { children: React.ReactNode; color: string }) {
  return <View style={[styles.centerButtonContainer, { backgroundColor: color }]}>{children}</View>;
}

export default function AppTabs() {
  const { dark } = useTheme();
  const { userChats } = useChatContext();

  const totalUnreadCount = userChats
    ? userChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)
    : 0;

    console.log('totalUnreadCount', totalUnreadCount);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: dark ? '#FFFFFF' : '#000000',
        tabBarStyle: {
          position: 'absolute',
          elevation: 10,
          borderRadius: 30,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
        tabBarBackground: () => (
          <BlurView tint="systemMaterial" intensity={60} style={StyleSheet.absoluteFill} />
        ),
      }}
      initialRouteName="chats">
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <TabBarIcon name={focused ? 'comments' : 'comments-o'} color={color} />
              <NotificationBadge count={totalUnreadCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile2"
        options={{
          title: 'Exchange',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <CenterTabButton color="#FFB0FE">
              <TabBarIcon name="anchor" color="#FFFFFF" />
            </CenterTabButton>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <TabBarIcon name={focused ? 'user' : 'user-o'} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 5,
  },
  centerButtonContainer: {
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 12,
    shadowColor: '#FFB0FE',
    shadowRadius: 7,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    height: 3,
    backgroundColor: '#34D399',
    borderRadius: 1.5,
  },

  badgeContainer: {
    position: 'absolute',
    top: -3, // Adjust position as needed
    right: -8, // Adjust position as needed
    backgroundColor: 'red', // Badge color
    borderRadius: 10, // Make it round
    minWidth: 20, // Ensure it's wide enough for numbers
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4, // Add padding for better look
    zIndex: 1, // Ensure it's above the icon
  },
  badgeText: {
    color: 'white', // Text color
    fontSize: 12, // Text size
    fontWeight: 'bold',
  },
});
