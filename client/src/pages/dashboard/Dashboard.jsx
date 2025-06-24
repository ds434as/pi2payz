import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { 
  FiDollarSign, 
  FiCreditCard, 
  FiCheckCircle, 
  FiClock,
  FiArrowUp,
  FiArrowDown,
  FiActivity,
  FiPieChart,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ComposedChart,
  Scatter
} from 'recharts';

const Dashboard = () => {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const userData = JSON.parse(localStorage.getItem("userData"));
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${base_url}/api/user/dashboard-data/${userData._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <div>No data available</div>
      </div>
    );
  }

  // Prepare dynamic chart data based on time range
  const prepareChartData = () => {
    const now = new Date();
    let data = [];
    let days = 7;
    let dateFormat = 'EEE'; // Short day names
    
    if (timeRange === 'day') {
      days = 24;
      dateFormat = 'HH:mm';
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(now.getHours() - i);
        data.push({
          name: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          payin: Math.round(Math.random() * 2000 + 500),
          payout: Math.round(Math.random() * 1500 + 300),
          transactions: Math.round(Math.random() * 20 + 5)
        });
      }
    } else if (timeRange === 'week') {
      days = 7;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        data.push({
          name: date.toLocaleDateString([], { weekday: 'short' }),
          payin: Math.round(Math.random() * 5000 + 1000),
          payout: Math.round(Math.random() * 4000 + 800),
          transactions: Math.round(Math.random() * 50 + 10)
        });
      }
    } else if (timeRange === 'month') {
      days = 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        data.push({
          name: date.toLocaleDateString([], { day: 'numeric', month: 'short' }),
          payin: Math.round(Math.random() * 8000 + 2000),
          payout: Math.round(Math.random() * 6000 + 1500),
          transactions: Math.round(Math.random() * 80 + 20)
        });
      }
    } else { // year
      days = 12;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        data.push({
          name: date.toLocaleDateString([], { month: 'short' }),
          payin: Math.round(Math.random() * 30000 + 10000),
          payout: Math.round(Math.random() * 25000 + 8000),
          transactions: Math.round(Math.random() * 300 + 100)
        });
      }
    }
    
    return data;
  };

  const chartData = prepareChartData();

  const statusData = [
    { name: 'Completed', value: dashboardData.summary.payin.completedTransactions, color: '#10B981' },
    { name: 'Pending', value: dashboardData.summary.payin.pendingTransactions, color: '#F59E0B' },
    { name: 'Failed', value: dashboardData.summary.payin.rejectedTransactions, color: '#EF4444' },
  ];

  const paymentMethodsData = [
    { name: 'Bank Transfer', value: 45, color: '#4F46E5' },
    { name: 'Credit Card', value: 30, color: '#8B5CF6' },
    { name: 'Mobile Payment', value: 15, color: '#EC4899' },
    { name: 'Other', value: 10, color: '#F97316' },
  ];

  const radialData = [
    {
      name: 'Usage',
      value: 75,
      fill: '#4F46E5',
    }
  ];

  const summaryCards = [
    {
      title: 'Total Received',
      value: `৳${dashboardData.summary.bankAccounts.totalReceived.toLocaleString()}`,
      icon: <FaBangladeshiTakaSign className="w-6 h-6" />,
      change: '+12%',
      isPositive: true,
      gradient: 'from-indigo-500 to-blue-500',
      chart: (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSummary1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="payin" stroke="#FFFFFF" fillOpacity={1} fill="url(#colorSummary1)" />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    {
      title: 'Total Payouts',
      value: `৳${dashboardData.summary.bankAccounts.totalPayouts.toLocaleString()}`,
      icon: <FiCreditCard className="w-6 h-6" />,
      change: '+5%',
      isPositive: true,
      gradient: 'from-green-500 to-teal-500',
      chart: (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSummary2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="payout" stroke="#FFFFFF" fillOpacity={1} fill="url(#colorSummary2)" />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    {
      title: 'Active Accounts',
      value: dashboardData.summary.bankAccounts.activeAccounts,
      icon: <FiCheckCircle className="w-6 h-6" />,
      change: '+2',
      isPositive: true,
      gradient: 'from-purple-500 to-pink-500',
      chart: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="payin" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: 'Pending Transactions',
      value: dashboardData.summary.payin.pendingTransactions + dashboardData.summary.payout.pendingTransactions,
      icon: <FiClock className="w-6 h-6" />,
      change: '-3',
      isPositive: false,
      gradient: 'from-amber-500 to-orange-500',
      chart: (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line type="monotone" dataKey="payin" stroke="#FFFFFF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )
    }
  ];

  // Custom tooltip for Payment Flow chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
              <span className="text-sm text-gray-600">Pay In:</span>
              <span className="ml-auto text-sm font-medium text-gray-900">
                ৳{payload[0].value.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">Payout:</span>
              <span className="ml-auto text-sm font-medium text-gray-900">
                ৳{payload[1].value.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
              <span className="text-sm text-gray-600">Transactions:</span>
              <span className="ml-auto text-sm font-medium text-gray-900">
                {payload[2].value}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend for charts
  const renderColorfulLegendText = (value, entry) => {
    const { color } = entry;
    return (
      <span style={{ color }} className="text-sm font-medium">
        {value}
      </span>
    );
  };

  return (
    <div className="flex h-screen font-fira bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Header toggleSidebar={toggleSidebar} />

        <main className="p-6">
          {/* Time Range Selector */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
              <p className="text-gray-500">Welcome back, {userData?.name || 'User'}!</p>
            </div>
            <div className="flex space-x-2 bg-white rounded-lg shadow-sm p-1">
              {['day', 'week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                    timeRange === range 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card, index) => (
              <div 
                key={index} 
                className={`bg-gradient-to-r ${card.gradient} rounded-xl shadow-lg p-6 text-white relative overflow-hidden`}
              >
                <div className="absolute inset-0 opacity-10">
                  {card.chart}
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">{card.title}</p>
                      <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg text-green-700 bg-white bg-opacity-20">
                      {card.icon}
                    </div>
                  </div>
                  <div className="flex items-center  mt-6">
                    {card.isPositive ? (
                      <FiTrendingUp className="w-5 h-5" />
                    ) : (
                      <FiTrendingDown className="w-5 h-5" />
                    )}
                    <span className="ml-2 text-sm font-medium">
                      {card.change} {card.isPositive ? 'up' : 'down'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
            {/* Enhanced Payment Flow Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Payment Flow Analytics</h2>
                  <p className="text-sm text-gray-500">
                    {timeRange === 'day' ? 'Last 24 hours' : 
                     timeRange === 'week' ? 'Last 7 days' : 
                     timeRange === 'month' ? 'Last 30 days' : 'Last 12 months'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="flex items-center px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded-md transition-colors hover:bg-indigo-100">
                    <FiActivity className="mr-1" /> Export
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickFormatter={(value) => `৳${value / 1000}k`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      formatter={renderColorfulLegendText}
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="payin" 
                      name="Pay In" 
                      stroke="#4F46E5" 
                      strokeWidth={2}
                      fillOpacity={0.2} 
                      fill="url(#colorPayin)" 
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="payout" 
                      name="Payout" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      fillOpacity={0.2} 
                      fill="url(#colorPayout)" 
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="transactions" 
                      name="Transactions" 
                      barSize={20} 
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorPayin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Enhanced Transaction Status Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Transaction Analytics</h2>
                  <p className="text-sm text-gray-500">Current month statistics</p>
                </div>
                <div className="flex space-x-2">
                  <button className="flex items-center px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded-md transition-colors hover:bg-gray-100">
                    <FiPieChart className="mr-1" /> Details
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <div className="flex h-full">
                    <div className="w-1/2 h-full pr-4">
                      <div className="h-1/2">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction Status</h3>
                        <ResponsiveContainer width="100%" height="80%">
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value} transactions`, '']}
                              contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-1/2 pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Methods</h3>
                        <ResponsiveContainer width="100%" height="80%">
                          <PieChart>
                            <Pie
                              data={paymentMethodsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                              {paymentMethodsData.map((entry, index) => (
                                <Cell key={`cell-method-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name) => [`${value}%`, name]}
                              contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="w-1/2 flex flex-col justify-between pl-4 border-l border-gray-100">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Status Breakdown</h3>
                        <div className="space-y-3">
                          {statusData.map((item, index) => (
                            <div key={`status-${index}`} className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-sm text-gray-600 flex-1">{item.name}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {item.value} <span className="text-gray-400">({Math.round((item.value / statusData.reduce((a, b) => a + b.value, 0)) * 100)}%)</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Success Rate</h3>
                        <div className="flex items-center">
                          <div className="w-2/3 pr-4">
                            <ResponsiveContainer width="100%" height={100}>
                              <RadialBarChart 
                                innerRadius="70%" 
                                outerRadius="90%" 
                                data={radialData} 
                                startAngle={90} 
                                endAngle={-270}
                              >
                                <PolarAngleAxis 
                                  type="number" 
                                  domain={[0, 100]} 
                                  angleAxisId={0} 
                                  tick={false}
                                />
                                <RadialBar
                                  background
                                  dataKey="value"
                                  cornerRadius={10}
                                  fill="#4F46E5"
                                />
                              </RadialBarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-1/3">
                            <div className="text-3xl font-bold text-gray-800">75%</div>
                            <div className="text-sm text-gray-500 mt-1">+5% from last month</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Methods Breakdown</h3>
                        <div className="space-y-2">
                          {paymentMethodsData.map((item, index) => (
                            <div key={`method-${index}`} className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-sm text-gray-600 flex-1">{item.name}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {item.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
                <p className="text-sm text-gray-500">Last 10 transactions</p>
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                View all →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentTransactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'payin' 
                              ? 'bg-indigo-100 text-indigo-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {transaction.type === 'payin' ? (
                              <FiArrowDown className="h-4 w-4" />
                            ) : (
                              <FiArrowUp className="h-4 w-4" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {transaction.type}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.method}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.account}</div>
                        <div className="text-sm text-gray-500">{transaction.bank}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ৳{transaction.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'completed' || transaction.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;