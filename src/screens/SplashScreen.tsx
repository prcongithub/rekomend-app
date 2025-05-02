import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { consentService } from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Splash'
>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCheckingConsent, setIsCheckingConsent] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      // Need to wait for auth state to be loaded before proceeding
      if (authLoading) {
        return;
      }

      setIsCheckingConsent(true);
      
      try {
        if (isAuthenticated) {
          // Check if the user has completed PAN verification and consent
          const hasPan = await AsyncStorage.getItem('userPanVerified');
          
          if (hasPan === 'true') {
            // Check for active consents
            const consentResponse = await consentService.listConsents();
            
            if (consentResponse.success && 
                consentResponse.consents && 
                consentResponse.consents.some(consent => consent.status === 'active')) {
              // User has active consent, go to Dashboard
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }]
              });
            } else {
              // User needs to provide consent
              navigation.reset({
                index: 0,
                routes: [{ name: 'PanVerification' }]
              });
            }
          } else {
            // User needs to verify PAN
            navigation.reset({
              index: 0,
              routes: [{ name: 'PanVerification' }]
            });
          }
        } else {
          // User is not authenticated, go to SignUp
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignUp' }]
            });
          }, 2000); // Show splash for 2 seconds for not-logged-in users
        }
      } catch (error) {
        console.error('Error during navigation decision:', error);
        // Default to PanVerification if authenticated, SignUp if not
        navigation.reset({
          index: 0,
          routes: [{ name: isAuthenticated ? 'PanVerification' : 'SignUp' }]
        });
      } finally {
        setIsCheckingConsent(false);
      }
    };

    // Start the check after a short delay for splash visibility
    const timer = setTimeout(checkUserStatus, 1500);
    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, authLoading]);

  return (
    <LinearGradient
      colors={['#0A2463', '#3E92CC']}
      style={styles.container}
    >
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.content}>
        <Text style={styles.title}>Rekomend</Text>
        <Text style={styles.subtitle}>Smart Finance Recommendations</Text>
        
        {(authLoading || isCheckingConsent) && (
          <ActivityIndicator 
            color="#FFFFFF" 
            size="large" 
            style={styles.loader} 
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  }
});

export default SplashScreen;