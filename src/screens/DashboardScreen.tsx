import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getRecommendations } from '../services/mockApi'; // Still use mock recommendations for now
import apiService from '../services/apiService';
import LogoutButton from '../components/LogoutButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { phoneNumber } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [consentId, setConsentId] = useState<string | null>(null);
  const [hasActiveConsent, setHasActiveConsent] = useState(false);
  const [noAccountsFound, setNoAccountsFound] = useState(false);

  // Fetch active consent and its financial data
  useEffect(() => {
    fetchConsentAndData();
  }, []);

  const fetchConsentAndData = async () => {
    try {
      setIsLoading(true);
      // Check if user has an active consent
      const consentResponse = await apiService.consent.listConsents();
      
      let activeConsent = null;
      if (consentResponse.success && consentResponse.consents) {
        // Find an active consent
        activeConsent = consentResponse.consents.find(consent => consent.status === 'active');
        
        if (activeConsent) {
          setConsentId(activeConsent.id);
          setHasActiveConsent(true);
          
          // Try to load financial data for this consent
          await fetchFinancialData(activeConsent.id.toString());
        } else {
          setHasActiveConsent(false);
        }
      }
      
      // Always load recommendations (mock data for now)
      const recommendationsResponse = await getRecommendations();
      if (recommendationsResponse.success && recommendationsResponse.data) {
        setRecommendations(recommendationsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching consent data:', error);
      Alert.alert(
        'Data Load Error',
        'Unable to load your financial data. Please try again later.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch financial data for a consent
  const fetchFinancialData = async (id: string) => {
    try {
      // Check if we have existing account data
      const userConsentActive = await AsyncStorage.getItem('userConsentActive');
      const storedConsentId = await AsyncStorage.getItem('userConsentId');
      
      // If this is a different consent or we don't have data, initiate a fetch
      if (userConsentActive !== 'true' || storedConsentId !== id) {
        // Initiate a data fetch for this consent
        await apiService.consent.fetchData(id);
        
        // Store that we've initiated a fetch for this consent
        await AsyncStorage.setItem('userConsentActive', 'true');
        await AsyncStorage.setItem('userConsentId', id);
      }
      // Now get the accounts for this consent
      const accountsResponse = await apiService.financialData.getAccounts(id);
      
      if (accountsResponse.success && accountsResponse.accounts) {
        if (accountsResponse.accounts.length > 0) {
          // Transform account data to portfolio format
          const portfolio = apiService.financialData.transformToPortfolio(accountsResponse.accounts);
          setPortfolioData(portfolio);
          setNoAccountsFound(false);
        } else {
          setNoAccountsFound(true);
        }
      } else {
        setNoAccountsFound(true);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchConsentAndData();
  };

  const renderPortfolioTab = () => {
    if (!portfolioData) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.portfolioSummary}>
          <Text style={styles.portfolioValue}>
            ₹{portfolioData.totalValue.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
        </View>

        <View style={styles.assetAllocation}>
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
          <View style={styles.assetTypes}>
            <View style={styles.assetType}>
              <View style={[styles.assetIndicator, { backgroundColor: '#3E92CC' }]} />
              <Text style={styles.assetLabel}>Equity</Text>
              <Text style={styles.assetValue}>₹{portfolioData.equity.toLocaleString('en-IN')}</Text>
              <Text style={styles.assetPercentage}>
                {((portfolioData.equity / portfolioData.totalValue) * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.assetType}>
              <View style={[styles.assetIndicator, { backgroundColor: '#1B998B' }]} />
              <Text style={styles.assetLabel}>Mutual Funds</Text>
              <Text style={styles.assetValue}>₹{portfolioData.mutualFunds.toLocaleString('en-IN')}</Text>
              <Text style={styles.assetPercentage}>
                {((portfolioData.mutualFunds / portfolioData.totalValue) * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.assetType}>
              <View style={[styles.assetIndicator, { backgroundColor: '#FF9B54' }]} />
              <Text style={styles.assetLabel}>Fixed Deposits</Text>
              <Text style={styles.assetValue}>₹{portfolioData.fixedDeposits.toLocaleString('en-IN')}</Text>
              <Text style={styles.assetPercentage}>
                {((portfolioData.fixedDeposits / portfolioData.totalValue) * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.assetType}>
              <View style={[styles.assetIndicator, { backgroundColor: '#E84855' }]} />
              <Text style={styles.assetLabel}>Cash</Text>
              <Text style={styles.assetValue}>₹{portfolioData.cash.toLocaleString('en-IN')}</Text>
              <Text style={styles.assetPercentage}>
                {((portfolioData.cash / portfolioData.totalValue) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.holdingsSection}>
          <Text style={styles.sectionTitle}>Your Holdings</Text>
          {portfolioData.holdings.map((holding: any, index: number) => (
            <View key={index} style={styles.holdingItem}>
              <View style={styles.holdingDetails}>
                <Text style={styles.holdingName}>{holding.name}</Text>
                <Text style={styles.holdingType}>
                  {holding.type === 'equity' ? 'Stock' : 
                   holding.type === 'mutual_fund' ? 'Mutual Fund' : 
                   holding.type === 'fd' ? 'Fixed Deposit' : 
                   holding.type}
                </Text>
              </View>
              <View style={styles.holdingValues}>
                <Text style={styles.holdingValue}>₹{holding.value.toLocaleString('en-IN')}</Text>
                <Text 
                  style={[styles.holdingGrowth, holding.growth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}
                >
                  {holding.growth > 0 ? '+' : ''}{holding.growth}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecommendationsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.recommendationsTitle}>
          Personalized Recommendations
        </Text>
        <Text style={styles.recommendationsSubtitle}>
          Based on your financial profile, we recommend the following investments
        </Text>

        {recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationType}>
                {recommendation.type === 'mutual_fund' ? 'Mutual Fund' : 
                 recommendation.type === 'stock' ? 'Equity' : 
                 recommendation.type === 'bond' ? 'Bond' : 
                 recommendation.type}
              </Text>
              <View 
                style={[styles.riskIndicator, 
                  recommendation.riskLevel === 'Low' ? styles.lowRisk :
                  recommendation.riskLevel === 'Moderate' ? styles.moderateRisk :
                  recommendation.riskLevel === 'Moderate-High' ? styles.moderateHighRisk :
                  styles.highRisk
                ]}
              >
                <Text style={styles.riskText}>{recommendation.riskLevel}</Text>
              </View>
            </View>
            
            <Text style={styles.recommendationName}>{recommendation.name}</Text>
            <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
            
            <View style={styles.recommendationFooter}>
              <Text style={styles.expectedReturn}>Expected Return: {recommendation.expectedReturn}%</Text>
              <TouchableOpacity style={styles.investButton}>
                <Text style={styles.investButtonText}>Invest</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A2463" />
        <Text style={styles.loadingText}>Loading your financial data...</Text>
      </View>
    );
  }

  // Render no consent message
  const renderNoConsentMessage = () => {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageTitle}>Account Access Required</Text>
        <Text style={styles.messageText}>
          To see your financial data, you need to provide consent for account access.
          Please visit the PAN Verification screen to give consent.
        </Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {/* Navigate to PAN screen */}}
        >
          <Text style={styles.actionButtonText}>Setup Account Access</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render waiting for data message
  const renderWaitingForDataMessage = () => {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageTitle}>Data Processing</Text>
        <Text style={styles.messageText}>
          We're currently processing your financial data. This might take a few minutes.
          Pull down to refresh and check for updates.
        </Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onRefresh}
        >
          <Text style={styles.actionButtonText}>Refresh Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.phoneNumber}>+91 {phoneNumber}</Text>
        </View>
        <LogoutButton variant="header" />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
          onPress={() => setActiveTab('portfolio')}
        >
          <Text style={[styles.tabText, activeTab === 'portfolio' && styles.activeTabText]}>My Portfolio</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>Recommendations</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#0A2463']}
          />
        }
      >
        {activeTab === 'portfolio' ? (
          !hasActiveConsent ? renderNoConsentMessage() :
          noAccountsFound ? renderWaitingForDataMessage() :
          renderPortfolioTab()
        ) : renderRecommendationsTab()}
        
        <View style={styles.logoutButtonContainer}>
          <LogoutButton style={styles.fullWidthLogoutButton} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0A2463',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0A2463',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#0A2463',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2463',
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#0A2463',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  portfolioSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  portfolioValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A2463',
    marginBottom: 5,
  },
  portfolioLabel: {
    fontSize: 14,
    color: '#666',
  },
  assetAllocation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  assetTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  assetType: {
    width: '48%',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  assetIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  assetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  assetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  assetPercentage: {
    fontSize: 12,
    color: '#666',
  },
  holdingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  holdingDetails: {
    flex: 3,
  },
  holdingName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  holdingType: {
    fontSize: 12,
    color: '#666',
  },
  holdingValues: {
    flex: 2,
    alignItems: 'flex-end',
  },
  holdingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  holdingGrowth: {
    fontSize: 12,
    fontWeight: '500',
  },
  positiveGrowth: {
    color: '#1B998B',
  },
  negativeGrowth: {
    color: '#E84855',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2463',
    marginBottom: 8,
  },
  recommendationsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowRisk: {
    backgroundColor: '#1B998B',
  },
  moderateRisk: {
    backgroundColor: '#3E92CC',
  },
  moderateHighRisk: {
    backgroundColor: '#FF9B54',
  },
  highRisk: {
    backgroundColor: '#E84855',
  },
  riskText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expectedReturn: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A2463',
  },
  investButton: {
    backgroundColor: '#0A2463',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  investButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  fullWidthLogoutButton: {
    width: '100%',
    paddingVertical: 15,
  },
});

export default DashboardScreen;
