import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/styles/ThemeContext";

function TabIcon({
  icon,
  focused,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="garden"
        options={{
          title: "Garden",
          tabBarLabel: "Garden",
          tabBarTestID: "tab-garden",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={focused ? "leaf" : "leaf-outline"} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Market",
          tabBarLabel: "Market",
          tabBarTestID: "tab-marketplace",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              icon={focused ? "storefront" : "storefront-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scan",
          tabBarLabel: "Scan",
          tabBarTestID: "tab-scanner",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              icon={focused ? "camera" : "camera-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarLabel: "Community",
          tabBarTestID: "tab-community",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              icon={focused ? "people" : "people-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarLabel: "Events",
          tabBarTestID: "tab-events",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={focused ? "calendar" : "calendar-outline"} focused={focused} color={color} />
          ),
        }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarTestID: "tab-profile",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              icon={focused ? "person" : "person-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
