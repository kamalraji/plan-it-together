import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface VendorPerformanceMetrics {
  vendorId: string;
  listingViews: number;
  inquiryCount: number;
  bookingCount: number;
  conversionRate: number;
  inquiryToBookingRate: number;
  averageResponseTime: number;
  completionRate: number;
  repeatCustomerRate: number;
  averageRating: number;
  totalReviews: number;
  revenue: number;
  averageOrderValue: number;
}

interface VendorTrendData {
  viewsOverTime: Array<{ date: string; views: number }>;
  bookingsOverTime: Array<{ date: string; bookings: number }>;
  revenueOverTime: Array<{ date: string; revenue: number }>;
  inquiriesOverTime: Array<{ date: string; inquiries: number }>;
}

interface VendorInsights {
  seasonalDemandPatterns: Array<{
    month: string;
    demandScore: number;
    bookingCount: number;
  }>;
  competitivePositioning: {
    marketRank: number;
    totalCompetitors: number;
    pricePosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
    ratingPosition: 'BELOW_AVERAGE' | 'AVERAGE' | 'ABOVE_AVERAGE';
  };
  pricingRecommendations: Array<{
    serviceId: string;
    serviceName: string;
    currentPrice: number;
    recommendedPrice: number;
    reasoning: string;
  }>;
  improvementSuggestions: Array<{
    category: 'RESPONSE_TIME' | 'PRICING' | 'SERVICE_QUALITY' | 'PORTFOLIO';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestion: string;
    expectedImpact: string;
  }>;
}

interface MarketIntelligence {
  categoryDemandForecast: Array<{
    category: string;
    currentDemand: number;
    projectedDemand: number;
    growthRate: number;
  }>;
  pricingBenchmarks: Array<{
    category: string;
    averagePrice: number;
    medianPrice: number;
    priceRange: { min: number; max: number };
  }>;
  emergingTrends: Array<{
    trend: string;
    description: string;
    relevanceScore: number;
    actionable: boolean;
  }>;
}

interface VendorAnalyticsDashboardProps {
  vendorId: string;
}

const VendorAnalyticsDashboard: React.FC<VendorAnalyticsDashboardProps> = ({ vendorId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'insights' | 'market'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [performanceMetrics, setPerformanceMetrics] = useState<VendorPerformanceMetrics | null>(null);
  const [trendData, setTrendData] = useState<VendorTrendData | null>(null);
  const [insights, setInsights] = useState<VendorInsights | null>(null);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [vendorId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data
      const [metricsRes, trendsRes, insightsRes, marketRes] = await Promise.all([
        fetch(`/api/vendors/${vendorId}/performance`, {
          credentials: 'include',
        }),
        fetch(`/api/vendors/${vendorId}/trends`, {
          credentials: 'include',
        }),
        fetch(`/api/vendors/${vendorId}/insights`, {
          credentials: 'include',
        }),
        fetch('/api/vendors/market/intelligence', {
          credentials: 'include',
        }),
      ]);

      if (!metricsRes.ok || !trendsRes.ok || !insightsRes.ok || !marketRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [metricsData, trendsData, insightsData, marketData] = await Promise.all([
        metricsRes.json(),
        trendsRes.json(),
        insightsRes.json(),
        marketRes.json(),
      ]);

      setPerformanceMetrics(metricsData.data);
      setTrendData(trendsData.data);
      setInsights(insightsData.data);
      setMarketIntelligence(marketData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchAnalyticsData}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Total Views</dt>
                <dd className="text-lg font-medium text-foreground">{performanceMetrics?.listingViews.toLocaleString()}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Inquiries</dt>
                <dd className="text-lg font-medium text-foreground">{performanceMetrics?.inquiryCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Bookings</dt>
                <dd className="text-lg font-medium text-foreground">{performanceMetrics?.bookingCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Revenue</dt>
                <dd className="text-lg font-medium text-foreground">${performanceMetrics?.revenue.toLocaleString()}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Conversion Rate</h3>
          <div className="text-3xl font-bold text-blue-600">
            {performanceMetrics?.conversionRate.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">Views to Inquiries</p>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Booking Rate</h3>
          <div className="text-3xl font-bold text-green-600">
            {performanceMetrics?.inquiryToBookingRate.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">Inquiries to Bookings</p>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Average Rating</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-yellow-600">
              {performanceMetrics?.averageRating.toFixed(1)}
            </div>
            <div className="ml-2 flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${
                    star <= (performanceMetrics?.averageRating || 0)
                      ? 'text-yellow-400'
                      : 'text-muted-foreground/70'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{performanceMetrics?.totalReviews} reviews</p>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Bookings Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData?.bookingsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData?.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Distribution Chart */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-foreground mb-4">Service Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Photography', value: 35, color: '#3B82F6' },
                { name: 'Catering', value: 25, color: '#10B981' },
                { name: 'Venue', value: 20, color: '#F59E0B' },
                { name: 'Music', value: 15, color: '#EF4444' },
                { name: 'Other', value: 5, color: '#8B5CF6' }
              ]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
            >
              {[
                { name: 'Photography', value: 35, color: '#3B82F6' },
                { name: 'Catering', value: 25, color: '#10B981' },
                { name: 'Venue', value: 20, color: '#F59E0B' },
                { name: 'Music', value: 15, color: '#EF4444' },
                { name: 'Other', value: 5, color: '#8B5CF6' }
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Response Time</h3>
          <div className="text-3xl font-bold text-blue-600">
            {performanceMetrics?.averageResponseTime}h
          </div>
          <div className="mt-2">
            <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              (performanceMetrics?.averageResponseTime || 0) <= 12 
                ? 'bg-green-100 text-green-800' 
                : (performanceMetrics?.averageResponseTime || 0) <= 24
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {(performanceMetrics?.averageResponseTime || 0) <= 12 ? 'Excellent' : 
               (performanceMetrics?.averageResponseTime || 0) <= 24 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Completion Rate</h3>
          <div className="text-3xl font-bold text-green-600">
            {performanceMetrics?.completionRate.toFixed(1)}%
          </div>
          <div className="mt-2">
            <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              (performanceMetrics?.completionRate || 0) >= 95 
                ? 'bg-green-100 text-green-800' 
                : (performanceMetrics?.completionRate || 0) >= 85
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {(performanceMetrics?.completionRate || 0) >= 95 ? 'Excellent' : 
               (performanceMetrics?.completionRate || 0) >= 85 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Repeat Customer Rate</h3>
          <div className="text-3xl font-bold text-purple-600">
            {performanceMetrics?.repeatCustomerRate.toFixed(1)}%
          </div>
          <div className="mt-2">
            <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              (performanceMetrics?.repeatCustomerRate || 0) >= 30 
                ? 'bg-green-100 text-green-800' 
                : (performanceMetrics?.repeatCustomerRate || 0) >= 15
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {(performanceMetrics?.repeatCustomerRate || 0) >= 30 ? 'Excellent' : 
               (performanceMetrics?.repeatCustomerRate || 0) >= 15 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Demand Pattern */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-foreground mb-4">Seasonal Demand Patterns</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={insights?.seasonalDemandPatterns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="demandScore" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Competitive Positioning */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-foreground mb-4">Competitive Positioning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              #{insights?.competitivePositioning.marketRank}
            </div>
            <div className="text-sm text-muted-foreground">Market Rank</div>
            <div className="text-xs text-muted-foreground">
              out of {insights?.competitivePositioning.totalCompetitors} competitors
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              insights?.competitivePositioning.pricePosition === 'ABOVE_MARKET' ? 'text-red-600' :
              insights?.competitivePositioning.pricePosition === 'BELOW_MARKET' ? 'text-green-600' :
              'text-yellow-600'
            }`}>
              {insights?.competitivePositioning.pricePosition.replace('_', ' ')}
            </div>
            <div className="text-sm text-muted-foreground">Price Position</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              insights?.competitivePositioning.ratingPosition === 'ABOVE_AVERAGE' ? 'text-green-600' :
              insights?.competitivePositioning.ratingPosition === 'BELOW_AVERAGE' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {insights?.competitivePositioning.ratingPosition.replace('_', ' ')}
            </div>
            <div className="text-sm text-muted-foreground">Rating Position</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${performanceMetrics?.averageOrderValue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Avg Order Value</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Pricing Recommendations */}
      {insights?.pricingRecommendations && insights.pricingRecommendations.length > 0 && (
        <div className="bg-card p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-foreground mb-4">Pricing Recommendations</h3>
          <div className="space-y-4">
            {insights.pricingRecommendations.map((rec, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-foreground">{rec.serviceName}</h4>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Current: ${rec.currentPrice}</div>
                    <div className="text-sm font-medium text-green-600">
                      Recommended: ${rec.recommendedPrice}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-foreground mb-4">Improvement Suggestions</h3>
        <div className="space-y-4">
          {insights?.improvementSuggestions.map((suggestion, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-3 ${
                    suggestion.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    suggestion.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {suggestion.priority}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {suggestion.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-foreground mb-2">{suggestion.suggestion}</p>
              <p className="text-xs text-muted-foreground">{suggestion.expectedImpact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMarketTab = () => (
    <div className="space-y-6">
      {/* Category Demand Forecast */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-foreground mb-4">Category Demand Forecast</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Current Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Projected Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Growth Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {marketIntelligence?.categoryDemandForecast.map((forecast, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {forecast.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {forecast.currentDemand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {forecast.projectedDemand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      forecast.growthRate > 0 ? 'bg-green-100 text-green-800' : 
                      forecast.growthRate < 0 ? 'bg-red-100 text-red-800' :
                      'bg-muted text-foreground'
                    }`}>
                      {forecast.growthRate > 0 ? '+' : ''}{forecast.growthRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Benchmarks */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-foreground mb-4">Pricing Benchmarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketIntelligence?.pricingBenchmarks.map((benchmark, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">{benchmark.category}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average:</span>
                  <span className="font-medium">${benchmark.averagePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Median:</span>
                  <span className="font-medium">${benchmark.medianPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Range:</span>
                  <span className="font-medium">
                    ${benchmark.priceRange.min} - ${benchmark.priceRange.max}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emerging Trends */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-foreground mb-4">Emerging Trends</h3>
        <div className="space-y-4">
          {marketIntelligence?.emergingTrends.map((trend, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-foreground">{trend.trend}</h4>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">Relevance:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    trend.relevanceScore >= 80 ? 'bg-green-100 text-green-800' :
                    trend.relevanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-muted text-foreground'
                  }`}>
                    {trend.relevanceScore}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{trend.description}</p>
              {trend.actionable && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Actionable
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Vendor Analytics Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Track your performance, get insights, and optimize your marketplace presence
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'performance', name: 'Performance', icon: '📈' },
            { id: 'insights', name: 'Insights', icon: '💡' },
            { id: 'market', name: 'Market Intelligence', icon: '🎯' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'insights' && renderInsightsTab()}
      {activeTab === 'market' && renderMarketTab()}
    </div>
  );
};

export default VendorAnalyticsDashboard;