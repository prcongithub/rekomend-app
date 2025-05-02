import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

type OtpVerificationRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;
type OtpVerificationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OtpVerification'
>;

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30; // seconds

const OtpVerificationScreen = () => {
  const navigation = useNavigation<OtpVerificationNavigationProp>();
  const route = useRoute<OtpVerificationRouteProp>();
  const { login } = useAuth();
  const { phoneNumber } = route.params;

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleResendOtp = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(RESEND_TIMEOUT);

    try {
      const email = route.params.email;
      const response = await authService.requestOtp(phoneNumber, email);
      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) {
      Alert.alert('Invalid Input', `Please enter a valid ${OTP_LENGTH}-digit OTP`);
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await authService.verifyOtp(phoneNumber, otp);
      
      if (response.success && response.token) {
        login(response.token, phoneNumber);
        
        // Navigate to the next screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'PanVerification' }],
        });
      } else {
        Alert.alert('Error', response.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to +91 {phoneNumber}
        </Text>

        <View style={styles.otpContainer}>
          <TextInput
            ref={inputRef}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            value={otp}
            onChangeText={setOtp}
            autoFocus
          />
          
          <View style={styles.otpBoxesContainer}>
            {Array(OTP_LENGTH).fill(0).map((_, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.otpBox}
                onPress={() => inputRef.current?.focus()}
              >
                <Text style={styles.otpText}>
                  {otp[index] || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, otp.length !== OTP_LENGTH && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={otp.length !== OTP_LENGTH || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity 
            onPress={handleResendOtp}
            disabled={!canResend}
          >
            <Text style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}>
              {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  otpInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    width: 45,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0A2463',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#666',
  },
  resendButton: {
    color: '#0A2463',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#A0A0A0',
  },
});

export default OtpVerificationScreen;