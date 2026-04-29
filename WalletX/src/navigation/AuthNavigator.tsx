// ─── Auth Navigator ───────────────────────────────────────────────────────────
// Stack: Onboarding → Login → Signup

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen      from '../screens/LoginScreen';
import SignupScreen     from '../screens/SignupScreen';
import type { AuthStackParamList } from '../types';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login"      component={LoginScreen}      />
      <Stack.Screen name="Signup"     component={SignupScreen}     />
    </Stack.Navigator>
  );
}
