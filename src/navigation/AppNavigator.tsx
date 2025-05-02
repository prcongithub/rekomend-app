import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  SplashScreen,
  SignUpScreen,
  OtpVerificationScreen,
  PanVerificationScreen,
  SetuConsentScreen,
  DashboardScreen
} from '../screens';

import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Splash: undefined;
  SignUp: undefined;
  OtpVerification: { phoneNumber: string };
  PanVerification: undefined;
  SetuConsent: { consentUrl: string; consentId: string };
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="PanVerification" component={PanVerificationScreen} />
            <Stack.Screen name="SetuConsent" component={SetuConsentScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;