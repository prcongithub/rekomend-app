import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from './constants';

// Centralized request handler
export const request = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: object,
  includeToken: boolean = false
) => {
  try {
    // Configuration for the fetch request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Include auth token if required
    if (includeToken) {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Adding auth token to request:', `Bearer ${token}`);
      } else {
        console.error('Auth token required but not found in AsyncStorage');
      }
    }

    // Create the request options
    const options: RequestInit = {
      method,
      headers,
      // Add a timeout by using AbortController in a real implementation
    };

    // Add body data for non-GET requests
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    // Log request details in development
    console.log(`API Request: ${method} ${API_BASE_URL}${endpoint}`);
    if (data) {
      console.log('Request data:', JSON.stringify(data));
    }

    // Execute the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const contentType = response.headers.get('content-type');
    
    // Parse the response based on content type
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    // Log response in development
    console.log(`API Response (${response.status}):`, result);

    // Handle non-200 responses
    if (!response.ok) {
      throw new Error(result.error || result.message || `Server returned ${response.status}`);
    }

    return result;
  } catch (error) {
    // Provide more detailed error logging
    if (error instanceof TypeError && error.message === 'Network request failed') {
      console.error(`Network request failed to ${API_BASE_URL}${endpoint}. Check your network connection and API server.`);
      // You might want to dispatch an action to update UI for network error
    } else {
      console.error(`API request to ${endpoint} failed:`, error);
    }
    throw error;
  }
};

// Authentication services
export const authService = {
  // Request OTP for login/signup
  requestOtp: async (phoneNumber: string, email?: string) => {
    try {
      const response = await request(
        API_ENDPOINTS.REQUEST_OTP,
        'POST',
        { mobile: phoneNumber, email }
      );
      return { 
        success: response.success || false, 
        message: response.message || 'OTP sent successfully' 
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  },

  // Verify OTP
  verifyOtp: async (phoneNumber: string, otp: string) => {
    try {
      const response = await request(
        API_ENDPOINTS.VERIFY_OTP,
        'POST',
        { mobile: phoneNumber, otp }
      );
      
      // Store authentication token if provided
      if (response.data && response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
      }
      
      return { 
        success: response.success || false, 
        token: response.data?.token || null,
        user: response.data?.user || null,
        message: response.message || 'OTP verified successfully'
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  },

  // Register new user
  register: async (userData: {
    mobile: string;
    email?: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
  }) => {
    try {
      const response = await request(
        API_ENDPOINTS.REGISTER,
        'POST',
        { user: userData }
      );
      return { 
        success: response.success || false, 
        user: response.data?.user || null,
        message: response.message || 'Registration successful'
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }
};

// Setu Consent services
export const consentService = {
  // Create a new consent request with PAN
  createConsent: async (pan: string) => {
    try {
      const response = await request(
        API_ENDPOINTS.CREATE_CONSENT,
        'POST',
        { pan },
        true // Include auth token
      );
      
      return { 
        success: response.success || false, 
        consent: response.data?.consent || null,
        message: response.message || 'Consent request created successfully'
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  },
  
  // Get a specific consent status
  getConsent: async (consentId: string) => {
    try {
      const response = await request(
        `${API_ENDPOINTS.GET_CONSENT}/${consentId}`,
        'GET',
        undefined,
        true // Include auth token
      );
      
      return { 
        success: response.success || false, 
        consent: response.data?.consent || null,
        message: response.message || 'Consent retrieved successfully'
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  },
  
  // List all consents for the current user
  listConsents: async () => {
    try {
      const response = await request(
        API_ENDPOINTS.LIST_CONSENTS,
        'GET',
        undefined,
        true // Include auth token
      );
      
      return { 
        success: response.success || false, 
        consents: response.data?.consents || [],
        message: response.message || 'Consents retrieved successfully'
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }
};

export default {
  auth: authService,
  consent: consentService
};