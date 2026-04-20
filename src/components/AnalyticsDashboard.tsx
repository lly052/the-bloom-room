import React,{ useMemo } from 'react';
import { Order } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PoundSterling, Package, ShoppingCart } from 'lucide-react';

interface AnalyticsDashboardProps {
  orders: Order[];
}

export function AnalyticsDashboard({ orders }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalOrders = orders.length;
    const totalArrangements = orders.reduce((sum, order) => sum + order.quantity, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status distribution
    const statusData = [
      { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#fbbf24' },
      { name: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: '#3b82f6' },
      { name: 'Arranged', value: orders.filter(o => o.status === 'arranged').length, color: '#a855f7' },
      { name: 'Out for Delivery', value: orders.filter(o => o.status === 'out-for-delivery').length, color: '#f97316' },
      { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#22c55e' },
      { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' }
    ].filter(item => item.value > 0);

    // Revenue by month
    const monthlyRevenue = orders.reduce((acc, order) => {
      const month = new Date(order.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += order.amount;
      return acc;
    }, {} as Record<string, number>);

    const revenueData = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6);

    // Top arrangements
    const arrangementRevenue = orders.reduce((acc, order) => {
      if (!acc[order.arrangement]) {
        acc[order.arrangement] = 0;
      }
      acc[order.arrangement] += order.amount;
      return acc;
    }, {} as Record<string, number>);

    const arrangementData = Object.entries(arrangementRevenue)
      .map(([arrangement, revenue]) => ({ arrangement, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Occasions breakdown
    const occasionCounts = orders.reduce((acc, order) => {
      if (!acc[order.occasion]) {
        acc[order.occasion] = 0;
      }
      acc[order.occasion] += 1;
      return acc;
    }, {} as Record<string, number>);

    const occasionData = Object.entries(occasionCounts)
      .map(([occasion, count]) => ({ occasion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalRevenue,
      totalOrders,
      totalArrangements,
      averageOrderValue,
      statusData,
      revenueData,
      arrangementData,
      occasionData
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-600">Total Revenue</CardTitle>
            <PoundSterling className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">£{analytics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">All-time revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-600">Total Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{analytics.totalOrders}</div>
            <p className="text-xs text-slate-500 mt-1">All orders processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-600">Arrangements Sold</CardTitle>
            <Package className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{analytics.totalArrangements}</div>
            <p className="text-xs text-slate-500 mt-1">Total units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-600">Avg. Order Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">£{analytics.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Per order average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`£${value.toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Arrangements */}
        <Card>
          <CardHeader>
            <CardTitle>Top Arrangements</CardTitle>
            <CardDescription>Revenue by arrangement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.arrangementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="arrangement" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`£${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Occasions Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Occasions Breakdown</CardTitle>
            <CardDescription>Orders by occasion</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.occasionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="occasion" type="category" stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [value, 'Orders']}
                />
                <Bar dataKey="count" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}