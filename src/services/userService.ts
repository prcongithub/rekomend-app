import { request } from './apiService';
import { API_ENDPOINTS } from './constants';

export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await request(
        API_ENDPOINTS.USER_PROFILE,
        'GET',
        undefined,
        true // Include token in request
      );
      return {
        success: response.success || false,
        user: response.data?.user || null,
        message: response.message || 'Profile retrieved successfully'
      };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }
};

export default userService;