import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#a0aec0',
        tabBarStyle: { paddingBottom: 5, height: 55 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Medications',
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerTitle: 'MedGuardian',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💊</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Main" component={HomeTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddMedication"
            component={AddMedicationScreen}
            options={{
              title: 'Add Medication',
              headerStyle: { backgroundColor: '#667eea' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </AppProvider>
  );
}
