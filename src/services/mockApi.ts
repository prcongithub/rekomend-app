// Mock API service for the Rekomend app

// Mock function to request OTP
export const requestOtp = async (phoneNumber: string): Promise<{ success: boolean, message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Validate phone number (basic Indian format)
  if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
    return { success: false, message: 'Invalid phone number format' };
  }
  
  return { success: true, message: 'OTP sent successfully' };
};

// Mock function to verify OTP
export const verifyOtp = async (phoneNumber: string, otp: string): Promise<{ success: boolean, token?: string, message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, any 6-digit OTP is valid
  if (!/^\d{6}$/.test(otp)) {
    return { success: false, message: 'Invalid OTP format' };
  }
  
  // Mock success response with auth token
  return { 
    success: true, 
    token: 'mock-jwt-token-' + Date.now(), 
    message: 'OTP verified successfully' 
  };
};

// Mock function to verify PAN card
export const verifyPan = async (pan: string): Promise<{ success: boolean, message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Validate PAN format (Indian PAN: 5 letters, 4 numbers, 1 letter)
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
    return { success: false, message: 'Invalid PAN format' };
  }
  
  return { success: true, message: 'PAN verified successfully' };
};

// Mock function for consent flow
export const initiateConsentFlow = async (): Promise<{ success: boolean, consentUrl: string, message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would return a URL to the Setu consent manager
  return { 
    success: true, 
    consentUrl: 'https://setu.co/consent', 
    message: 'Consent flow initiated' 
  };
};

// Mock function to confirm consent completion
export const checkConsentStatus = async (): Promise<{ success: boolean, completed: boolean, message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Always return success for demo
  return { 
    success: true, 
    completed: true, 
    message: 'Consent successfully processed' 
  };
};

// Mock function to get portfolio summary
export const getPortfolioSummary = async (): Promise<{ 
  success: boolean, 
  data?: {
    totalValue: number,
    equity: number,
    mutualFunds: number,
    fixedDeposits: number,
    cash: number,
    holdings: Array<{
      type: string,
      name: string,
      value: number,
      growth: number
    }>
  }, 
  message: string 
}> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock portfolio data
  return { 
    success: true, 
    data: {
      totalValue: 753450.00,
      equity: 325000.00,
      mutualFunds: 250000.00,
      fixedDeposits: 150000.00,
      cash: 28450.00,
      holdings: [
        { type: 'equity', name: 'Reliance Industries', value: 125000.00, growth: 12.5 },
        { type: 'equity', name: 'HDFC Bank', value: 95000.00, growth: 8.2 },
        { type: 'equity', name: 'Infosys', value: 105000.00, growth: -2.1 },
        { type: 'mutual_fund', name: 'SBI Blue Chip Fund', value: 85000.00, growth: 15.3 },
        { type: 'mutual_fund', name: 'Axis Mid Cap Fund', value: 75000.00, growth: 18.7 },
        { type: 'mutual_fund', name: 'ICICI Prudential Value Discovery', value: 90000.00, growth: 9.5 },
        { type: 'fd', name: 'HDFC 1-year FD', value: 100000.00, growth: 6.5 },
        { type: 'fd', name: 'SBI 2-year FD', value: 50000.00, growth: 7.0 }
      ]
    },
    message: 'Portfolio data retrieved successfully' 
  };
};

// Mock function to get investment recommendations
export const getRecommendations = async (): Promise<{ 
  success: boolean, 
  data?: Array<{
    type: string,
    name: string,
    expectedReturn: number,
    riskLevel: string,
    description: string
  }>, 
  message: string 
}> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock recommendations
  return { 
    success: true, 
    data: [
      { 
        type: 'mutual_fund', 
        name: 'Mirae Asset Large Cap Fund', 
        expectedReturn: 12, 
        riskLevel: 'Moderate',
        description: 'Large cap fund with consistent performance'
      },
      { 
        type: 'mutual_fund', 
        name: 'Parag Parikh Flexi Cap Fund', 
        expectedReturn: 14, 
        riskLevel: 'Moderate-High',
        description: 'Diversified portfolio with domestic and international exposure'
      },
      { 
        type: 'stock', 
        name: 'TCS', 
        expectedReturn: 15, 
        riskLevel: 'Moderate',
        description: 'Leading IT services company with stable growth'
      },
      { 
        type: 'bond', 
        name: 'NHAI Bonds', 
        expectedReturn: 7.5, 
        riskLevel: 'Low',
        description: 'Government backed infrastructure bonds'
      }
    ],
    message: 'Recommendations retrieved successfully' 
  };
};