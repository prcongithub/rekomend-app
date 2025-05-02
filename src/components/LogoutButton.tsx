import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogoutButtonProps {
  variant?: 'default' | 'header' | 'text';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  variant = 'default',
  style,
  textStyle,
}) => {
  const { logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear PAN and consent data
              await AsyncStorage.multiRemove([
                'userPanVerified',
                'userPan',
                'userConsentActive',
                'userConsentId',
              ]);
              
              // Call auth context logout
              await logout();
              
              // Navigate to SignUp
              navigation.reset({
                index: 0,
                routes: [{ name: 'SignUp' as never }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  let buttonStyle: ViewStyle;
  let labelStyle: TextStyle;

  switch (variant) {
    case 'header':
      buttonStyle = styles.headerButton;
      labelStyle = styles.headerButtonText;
      break;
    case 'text':
      buttonStyle = styles.textButton;
      labelStyle = styles.textButtonText;
      break;
    default:
      buttonStyle = styles.defaultButton;
      labelStyle = styles.defaultButtonText;
  }

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={handleLogout}
      activeOpacity={0.7}
    >
      <Text style={[labelStyle, textStyle]}>Logout</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  defaultButton: {
    backgroundColor: '#E84855',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  textButton: {
    padding: 10,
  },
  textButtonText: {
    color: '#E84855',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LogoutButton;