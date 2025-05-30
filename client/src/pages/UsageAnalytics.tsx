import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const UsageAnalytics: React.FC = () => {
  // Very simple role check 
  // Get current user role directly from localStorage
  const userData = localStorage.getItem('currentUser');
  const currentUser = userData ? JSON.parse(userData) : null;
  const currentRole = currentUser?.role || 'user';
  
  // If not a superadmin, show unauthorized message
  if (currentRole !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 text-center max-w-md mb-6">
          This page requires Super Admin permissions.
          <br />
          Please contact your administrator if you need access.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-4 py-2 bg-[hsl(var(--msblue-primary))] text-white rounded-md hover:bg-[hsl(var(--msblue-dark))]"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  const { user, isSuperAdmin } = useAuth();

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
    enabled: !!user && isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold mb-4">Unauthorized Access</h1>
        <p className="text-gray-600">This page is only accessible to Super Admin users.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold mb-4">Usage Analytics</h1>
        <p className="text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Usage Analytics</h1>
        <p className="text-gray-600">Monitor usage patterns and performance metrics</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalQueries || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.activeUsers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.avgResponseTime || 0}s</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Contexts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.activeContexts || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Queries Over Time */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Queries Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analyticsData?.queriesOverTime || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-15} textAnchor="end" height={50} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke={colors[0]} 
                  dot={{ fill: 'hsl(var(--msblue-primary))', r: 4 }}
                  activeDot={{ fill: 'hsl(var(--msblue-primary))', r: 8 }} 
                  name="Queries"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Query Distribution by Context */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Query Distribution by Context</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData?.queryDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {(analyticsData?.queryDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        

      </div>
    </div>
  );
};

export default UsageAnalytics;
