import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getPortfolioSummary, getRecommendations } from '../services/mockApi';
import LogoutButton from '../components/LogoutButton';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { phoneNumber } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch portfolio data and recommendations in parallel
        const [portfolioResponse, recommendationsResponse] = await Promise.all([
          getPortfolioSummary(),
          getRecommendations()
        ]);

        if (portfolioResponse.success && portfolioResponse.data) {
          setPortfolioData(portfolioResponse.data);
        }

        if (recommendationsResponse.success && recommendationsResponse.data) {
          setRecommendations(recommendationsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

      <ScrollView style={styles.scrollContent}>
        {activeTab === 'portfolio' ? renderPortfolioTab() : renderRecommendationsTab()}
        
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