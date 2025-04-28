import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={25} {...props} />;
}

function CenterTabButton({ children, color }: { children: React.ReactNode; color: string }) {
  return <View style={[styles.centerButtonContainer, { backgroundColor: color }]}>{children}</View>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          elevation: 10,
          borderRadius: 30,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
            <TabBarIcon name={focused ? 'comments' : 'comments-o'} color={color} />
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
            <TabBarIcon name={focused ? 'user' : 'user-o'} color={color} />
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
});
