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
  },
  
  // Initiate data fetch for a consent
  fetchData: async (consentId: string) => {
    try {
      const response = await request(
        `${API_ENDPOINTS.FETCH_CONSENT_DATA}/${consentId}/data`,
        'GET',
        undefined,
        true // Include auth token
      );
      
      return {
        success: response.success || false,
        sessionId: response.data?.session_id,
        message: response.message || 'Data fetch initiated successfully'
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }
};

// Financial data services
export const financialDataService = {
  // Get all accounts for a consent
  getAccounts: async (consentId: string) => {
    try {
      const response = await request(
        `${API_ENDPOINTS.GET_ACCOUNTS}/${consentId}/accounts`,
        'GET',
        undefined,
        true // Include auth token
      );
      
      return {
        success: response.success || false,
        accounts: response.data?.accounts || [],
        message: response.message || 'Accounts retrieved successfully'
      };
    } catch (error) {
      return { success: false, accounts: [], message: (error as Error).message };
    }
  },
  
  // Get details for a specific account, including transactions and holdings
  getAccountDetails: async (consentId: string, accountId: string) => {
    try {
      const response = await request(
        `${API_ENDPOINTS.GET_ACCOUNT_DETAILS}/${consentId}/accounts/${accountId}`,
        'GET',
        undefined,
        true // Include auth token
      );
      
      return {
        success: response.success || false,
        account: response.data?.account,
        transactions: response.data?.transactions || [],
        holdings: response.data?.holdings || [],
        message: response.message || 'Account details retrieved successfully'
      };
    } catch (error) {
      return { 
        success: false, 
        account: null,
        transactions: [],
        holdings: [],
        message: (error as Error).message 
      };
    }
  },
  
  // Convert account data to portfolio format for the dashboard
  transformToPortfolio: (accounts: any[]) => {
    if (!accounts || accounts.length === 0) {
      return null;
    }
    
    // Initialize portfolio data structure
    const portfolio = {
      totalValue: 0,
      equity: 0,
      mutualFunds: 0,
      fixedDeposits: 0,
      cash: 0,
      holdings: [] as any[]
    };
    
    // Process each account
    accounts.forEach(account => {
      const balance = account.current_balance || 0;
      portfolio.totalValue += balance;
      
      // Categorize by financial institution type
      switch(account.fi_type) {
        case 'stock':
          portfolio.equity += balance;
          break;
        case 'mutual_fund':
          portfolio.mutualFunds += balance;
          break;
        case 'deposit':
          portfolio.fixedDeposits += balance;
          break;
        case 'bank':
          portfolio.cash += balance;
          break;
        default:
          // Default to cash for unknown types
          portfolio.cash += balance;
      }
      
      // Add to holdings list
      portfolio.holdings.push({
        id: account.id,
        type: account.fi_type,
        name: `${account.fi_name || 'Account'} - ${account.masked_account_number || account.account_id || 'Unknown'}`,
        value: balance,
        growth: 0, // We don't have growth data yet
        account_id: account.id // Store the account ID for later use
      });
    });
    
    return portfolio;
  }
};

export default {
  auth: authService,
  consent: consentService,
  financialData: financialDataService
};
