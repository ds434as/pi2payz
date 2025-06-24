import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { FaSearch, FaFilter, FaSync, FaCalendarAlt, FaTrashAlt } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Forwardsms = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providerFilter, setProviderFilter] = useState('All');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [limit, setLimit] = useState(10);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchMessages();
  }, [providerFilter, transactionTypeFilter, statusFilter, currentPage, limit]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      let url = `${base_url}/api/admin/forward-sms?page=${currentPage}&limit=${limit}`;
      
      // Add filters to URL if they're not 'All'
      const params = [];
      if (providerFilter !== 'All') params.push(`provider=${providerFilter}`);
      if (transactionTypeFilter !== 'All') params.push(`transactionType=${transactionTypeFilter}`);
      if (statusFilter !== 'All') params.push(`status=${statusFilter}`);
      
      if (params.length > 0) {
        url += `&${params.join('&')}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessages(response.data.data);
      setTotalPages(response.data.totalPages || 1);
      setTotalMessages(response.data.totalMessages || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forwarded SMS:', error);
      setError('Failed to fetch forwarded SMS');
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(message => 
        message.agentAccount.toLowerCase().includes(term) || 
        message.customerAccount.toLowerCase().includes(term) ||
        message.transactionId.toLowerCase().includes(term)
      );
    }
    
    if (dateRange.start && dateRange.end) {
      const start = startOfDay(new Date(dateRange.start));
      const end = endOfDay(new Date(dateRange.end));
      
      filtered = filtered.filter(message => {
        const messageDate = new Date(message.transactionDate);
        return messageDate >= start && messageDate <= end;
      });
    }
    
    return filtered;
  };

  const deleteMessage = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Message',
      text: 'Are you sure you want to delete this forwarded SMS?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-lg shadow-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          html: 'Please wait while we delete the message',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await axios.delete(
          `${base_url}/api/admin/forward-sms/${id}`, 
          { 
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        await Swal.fire({
          title: 'Deleted!',
          text: 'The forwarded SMS has been deleted.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          timerProgressBar: true
        });

        fetchMessages();
      } catch (error) {
        console.error('Error deleting message:', error);
        
        Swal.fire({
          title: 'Error!',
          text: error.response?.data?.message || 'Failed to delete message',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      }
    }
  };

  const handleDateChange = (e, type) => {
    setDateRange(prev => ({
      ...prev,
      [type]: new Date(e.target.value)
    }));
  };

  const resetDateFilter = () => {
    setDateRange({
      start: subDays(new Date(), 30),
      end: new Date()
    });
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'used':
          return 'bg-green-100 text-green-800';
        case 'arrived':
          return 'bg-blue-100 text-blue-800';
        case 'expired':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {status}
      </span>
    );
  };

  const filteredMessages = filterMessages();

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="bg-white rounded-lg shadow-sm py-4 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Forwarded SMS</h2>
              <button 
                onClick={fetchMessages}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaSync /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    value={providerFilter}
                    onChange={(e) => {
                      setProviderFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Providers</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select
                    value={transactionTypeFilter}
                    onChange={(e) => {
                      setTransactionTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Types</option>
                    <option value="payin">Pay In</option>
                    <option value="payout">Pay Out</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="arrived">Arrived</option>
                    <option value="used">Used</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-left"
                    >
                      <FaCalendarAlt className="text-gray-400" />
                      <span>
                        {format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd')}
                      </span>
                    </button>
                    
                    {showDatePicker && (
                      <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 w-full">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                            <input
                              type="date"
                              value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
                              onChange={(e) => handleDateChange(e, 'start')}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                            <input
                              type="date"
                              value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
                              onChange={(e) => handleDateChange(e, 'end')}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="flex justify-between">
                            <button
                              onClick={resetDateFilter}
                              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => setShowDatePicker(false)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by account number or transaction ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[5, 10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => {
                    setProviderFilter('All');
                    setTransactionTypeFilter('All');
                    setStatusFilter('All');
                    setSearchTerm('');
                    setDateRange({
                      start: subDays(new Date(), 30),
                      end: new Date()
                    });
                    setCurrentPage(1);
                  }}
                  className="ml-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Messages Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No forwarded messages found</p>
                </div>
              ) : (
                <>
                  <div className="shadow border-b border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Provider</th>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Agent Account</th>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Customer Account</th>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Transaction ID</th>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMessages.map((message) => (
                          <tr key={message._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {message.provider}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {message.agentAccount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {message.customerAccount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {message.transactionType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {message.transactionAmount} {message.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {message.transactionId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={message.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(message.transactionDate), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => deleteMessage(message._id)}
                                  className="p-2 bg-red-500 text-white rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * limit, totalMessages)}
                          </span>{' '}
                          of <span className="font-medium">{totalMessages}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <FiChevronLeft className="h-5 w-5" />
                          </button>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-blue-500 border-blue-500 text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <FiChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Forwardsms;