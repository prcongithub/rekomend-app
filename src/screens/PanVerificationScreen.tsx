import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { consentService } from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoutButton from '../components/LogoutButton';

type PanVerificationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PanVerification'
>;

const PanVerificationScreen = () => {
  const navigation = useNavigation<PanVerificationNavigationProp>();
  const [pan, setPan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing PAN and active consent when screen loads
  useEffect(() => {
    const checkExistingConsent = async () => {
      try {
        // First check if we have a stored PAN
        const storedPan = await AsyncStorage.getItem('userPan');
        
        if (storedPan) {
          setPan(storedPan);
          
          // Check if we have any active consents
          const consentResponse = await consentService.listConsents();
          
          if (consentResponse.success && 
              consentResponse.consents && 
              consentResponse.consents.some(consent => consent.status === 'active')) {
            // User already has an active consent, go directly to dashboard
            navigation.reset({
              index: 0,
              routes: [{ name: 'Dashboard' }]
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking existing consent:', error);
      } finally {
        setIsCheckingConsent(false);
      }
    };

    checkExistingConsent();
  }, [navigation]);

  const handleVerifyPan = async () => {
    // Reset error
    setError(null);
    
    // PAN format validation - 5 letters followed by 4 numbers and then 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      setError('Please enter a valid PAN number (e.g., ABCDE1234F)');
      return;
    }

    setIsLoading(true);
    try {
      // Call the real API to create a consent request
      const response = await consentService.createConsent(pan);
      
      if (response.success && response.consent?.consent_url) {
        // Store PAN verification status
        await AsyncStorage.setItem('userPanVerified', 'true');
        await AsyncStorage.setItem('userPan', pan);
        
        // Navigate to the consent screen with the consent URL and ID
        navigation.navigate('SetuConsent', {
          consentUrl: response.consent.consent_url,
          consentId: response.consent.id
        });
      } else {
        setError(response.message || 'Failed to create consent request. Please try again.');
      }
    } catch (error) {
      console.error('PAN verification error:', error);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PAN Verification</Text>
        <LogoutButton variant="header" />
      </View>
      
      {isCheckingConsent ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A2463" />
          <Text style={styles.loadingText}>Checking your verification status...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Verify Your PAN</Text>
          <Text style={styles.subtitle}>
            We need to verify your PAN details to provide personalized financial recommendations
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your PAN number"
              value={pan}
              onChangeText={(text) => setPan(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
              editable={!isLoading}
            />
            <Text style={styles.hintText}>Format: ABCDE1234F</Text>
            
            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, pan.length !== 10 && styles.buttonDisabled]}
              onPress={handleVerifyPan}
              disabled={pan.length !== 10 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Verify PAN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#0A2463',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#0A2463',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2463',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 40,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0A2463',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PanVerificationScreen;