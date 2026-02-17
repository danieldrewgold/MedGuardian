import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import MedicationDetailScreen from './src/screens/MedicationDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerTitle: 'MedGuardian',
              headerStyle: { backgroundColor: '#667eea' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />
          <Stack.Screen
            name="AddMedication"
            component={AddMedicationScreen}
            options={({ route }: any) => ({
              title: route.params?.editMedication ? 'Edit Medication' : 'Add Medication',
              headerStyle: { backgroundColor: '#667eea' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            })}
          />
          <Stack.Screen
            name="MedicationDetail"
            component={MedicationDetailScreen}
            options={{
              title: 'Medication Info',
              headerStyle: { backgroundColor: '#667eea' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </AppProvider>
  );
}
