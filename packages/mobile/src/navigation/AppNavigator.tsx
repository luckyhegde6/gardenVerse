import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OTPVerifyScreen } from '../screens/auth/OTPVerifyScreen';

// Garden Screens
import { GardenScreen } from '../screens/garden/GardenScreen';
import { CropDetailScreen } from '../screens/garden/CropDetailScreen';
import { PlantCropScreen } from '../screens/garden/PlantCropScreen';

// Marketplace Screens
import { MarketplaceScreen } from '../screens/marketplace/MarketplaceScreen';
import { ListingDetailScreen } from '../screens/marketplace/ListingDetailScreen';
import { CreateListingScreen } from '../screens/marketplace/CreateListingScreen';

// Community Screens
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { GroupDetailScreen } from '../screens/community/GroupDetailScreen';
import { ChatScreen } from '../screens/community/ChatScreen';

// Scanner
import { AiScannerScreen } from '../screens/scanner/AiScannerScreen';

// Weather
import { WeatherScreen } from '../screens/weather/WeatherScreen';

// IoT
import { IotDashboardScreen } from '../screens/iot/IotDashboardScreen';

// Profile Screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { AchievementsScreen } from '../screens/profile/AchievementsScreen';
import { InventoryScreen } from '../screens/profile/InventoryScreen';

import {
  AuthStackParamList,
  MainTabParamList,
  GardenStackParamList,
  MarketplaceStackParamList,
  CommunityStackParamList,
  ProfileStackParamList,
  RootStackParamList,
} from '../types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const GardenStack = createNativeStackNavigator<GardenStackParamList>();
const MarketplaceStack = createNativeStackNavigator<MarketplaceStackParamList>();
const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="OTPVerify" component={OTPVerifyScreen} />
    </AuthStack.Navigator>
  );
}

function GardenNavigator() {
  return (
    <GardenStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#166534',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <GardenStack.Screen
        name="GardenHome"
        component={GardenScreen}
        options={{ title: 'My Garden' }}
      />
      <GardenStack.Screen
        name="CropDetail"
        component={CropDetailScreen}
        options={{ title: 'Crop Details' }}
      />
      <GardenStack.Screen
        name="PlantCrop"
        component={PlantCropScreen}
        options={{ title: 'Plant Crop' }}
      />
    </GardenStack.Navigator>
  );
}

function MarketplaceNavigator() {
  return (
    <MarketplaceStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#166534',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <MarketplaceStack.Screen
        name="MarketplaceHome"
        component={MarketplaceScreen}
        options={{ title: 'Marketplace' }}
      />
      <MarketplaceStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: 'Listing Details' }}
      />
      <MarketplaceStack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{ title: 'New Listing' }}
      />
    </MarketplaceStack.Navigator>
  );
}

function CommunityNavigator() {
  return (
    <CommunityStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#166534',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <CommunityStack.Screen
        name="CommunityHome"
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
      <CommunityStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: 'Group' }}
      />
      <CommunityStack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </CommunityStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#166534',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
      <ProfileStack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: 'Inventory' }}
      />
    </ProfileStack.Navigator>
  );
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View className="items-center justify-center">
      <Text className={`text-xl ${focused ? '' : 'opacity-50'}`}>{icon}</Text>
    </View>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <MainTab.Screen
        name="GardenTab"
        component={GardenNavigator}
        options={{
          tabBarLabel: 'Garden',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🌱" focused={focused} />
          ),
        }}
      />
      <MainTab.Screen
        name="MarketplaceTab"
        component={MarketplaceNavigator}
        options={{
          tabBarLabel: 'Market',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏪" focused={focused} />
          ),
        }}
      />
      <MainTab.Screen
        name="ScannerTab"
        component={AiScannerScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📷" focused={focused} />
          ),
        }}
      />
      <MainTab.Screen
        name="CommunityTab"
        component={CommunityNavigator}
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👥" focused={focused} />
          ),
        }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" focused={focused} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-6xl mb-4">🌿</Text>
        <Text className="text-lg font-semibold text-gray-600">
          GardenVerse
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen
              name="Weather"
              component={WeatherScreen}
              options={{
                headerShown: true,
                headerTitle: 'Weather',
                headerTintColor: '#166534',
              }}
            />
            <RootStack.Screen
              name="IotDashboard"
              component={IotDashboardScreen}
              options={{
                headerShown: true,
                headerTitle: 'IoT Dashboard',
                headerTintColor: '#166534',
              }}
            />
            <RootStack.Screen
              name="AiScanner"
              component={AiScannerScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
