// API configuration
import { Platform } from 'react-native';

// For Android emulator, we need to use 10.0.2.2 to reference the host machine
// For iOS simulator, localhost works fine
// For physical devices, you need to use your computer's actual IP address on the network
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3031', // Special IP for Android emulator to reach host machine
  ios: 'https://fintechapilocal.ur-nl.com',    // iOS simulator can use localhost
  default: 'http://fintechapilocal.ur-nl.com' // Fallback
});


// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  REQUEST_OTP: '/api/auth/request_otp',
  VERIFY_OTP: '/api/auth/verify_otp',
  REGISTER: '/api/users',
  
  // User
  USER_PROFILE: '/api/users/profile',
  
  // Setu Consent
  CREATE_CONSENT: '/api/consents',
  GET_CONSENT: '/api/consents', // + '/:id' for specific consent
  LIST_CONSENTS: '/api/consents',
  FETCH_CONSENT_DATA: '/api/consents', // + '/:id/data' to initiate data fetch
  
  // Financial Data
  GET_ACCOUNTS: '/api/consents', // + '/:id/accounts' to get accounts for a consent
  GET_ACCOUNT_DETAILS: '/api/consents', // + '/:consent_id/accounts/:account_id' for details
};
