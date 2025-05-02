import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { consentService } from '../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoutButton from '../components/LogoutButton';

type SetuConsentNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SetuConsent'
>;

type SetuConsentRouteProps = RouteProp<
  {
    params: {
      consentUrl: string;
      consentId: string;
    }
  },
  'params'
>;

const SetuConsentScreen = () => {
  const navigation = useNavigation<SetuConsentNavigationProp>();
  const route = useRoute<SetuConsentRouteProps>();
  const { consentUrl, consentId } = route.params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [consentStatus, setConsentStatus] = useState<string>('pending');
  const [checkingConsent, setCheckingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(consentUrl);

  // Handle back button press in Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Show a confirmation dialog before allowing the user to go back
      Alert.alert(
        'Cancel Consent',
        'Are you sure you want to cancel the consent process?',
        [
          { text: 'No', style: 'cancel', onPress: () => {} },
          { 
            text: 'Yes', 
            style: 'destructive', 
            onPress: () => {
              navigation.goBack();
            }
          },
        ]
      );
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Poll for consent status
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;

    // Only start polling if we're not already checking and the user has started the consent flow
    if (!checkingConsent && consentId && consentStatus !== 'active') {
      const checkStatus = async () => {
        setCheckingConsent(true);
        try {
          const response = await consentService.getConsent(consentId);
          
          if (response.success && response.consent) {
            const newStatus = response.consent.status;
            setConsentStatus(newStatus);
            
            // If consent is active, store the status and navigate to dashboard
            if (newStatus === 'active') {
              // Store consent status in AsyncStorage
              try {
                await AsyncStorage.setItem('userConsentActive', 'true');
                await AsyncStorage.setItem('userConsentId', consentId);
              } catch (storageError) {
                console.error('Failed to store consent status:', storageError.toString());
              }
              
              setTimeout(() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Dashboard' }],
                });
              }, 1000);
            }
          }
        } catch (err) {
          console.error('Error checking consent status:', err);
        } finally {
          setCheckingConsent(false);
        }
      };
      
      // Check immediately and then every 3 seconds
      checkStatus();
      statusInterval = setInterval(checkStatus, 10000);
    }
    
    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [consentId, consentStatus, checkingConsent, navigation]);

  // Watch for URL changes in the WebView
  const handleNavigationStateChange = (navState: { url: string }) => {
    setCurrentUrl(navState.url);
    
    // Check if the URL contains a callback or success indicator
    // This depends on how Setu configures their callback URLs
    if (navState.url.includes('success') || navState.url.includes('callback')) {
      // Force a consent status check
      setCheckingConsent(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
          <View style={styles.logoutButtonContainer}>
            <LogoutButton variant="text" />
          </View>
        </View>
      ) : (
        <>
          {consentStatus === 'active' ? (
            <View style={styles.successContainer}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/100' }} 
                style={styles.successIcon} 
              />
              <Text style={styles.successText}>Consent Approved Successfully!</Text>
              <Text style={styles.successSubtext}>
                Thank you for providing consent. You're being redirected to your dashboard.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.headerText}>Account Aggregator Consent</Text>
                <LogoutButton variant="header" />
              </View>
              
              <WebView
                ref={webViewRef}
                source={{ uri: consentUrl }}
                style={styles.webView}
                //onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onNavigationStateChange={handleNavigationStateChange}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A2463" />
                  </View>
                )}
              />
              
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#0A2463" />
                  <Text style={styles.loadingText}>Loading Consent Form...</Text>
                </View>
              )}
            </>
          )}
        </>
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
    height: 60,
    backgroundColor: '#0A2463',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButtonContainer: {
    marginTop: 20,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#0A2463',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e53935',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0A2463',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A2463',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SetuConsentScreen;
