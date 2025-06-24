import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { format, parseISO } from 'date-fns';
import { FaEye, FaTrashAlt, FaEdit, FaSearch, FaFilter, FaSync } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

const Allpayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  
  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'success':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'rejected':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-blue-100 text-blue-800';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.3)]">
      <div 
        className="fixed inset-0 opacity-75" 
        onClick={onClose}
      ></div>
      
      <div className="relative z-[1001] bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
};

  // State for transactions and UI
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [limit, setLimit] = useState(20);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const token = localStorage.getItem('authToken');
  
  // Form states
  const [statusUpdate, setStatusUpdate] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch transactions with filters
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        status: statusFilter,
        search: searchQuery
      };
      
      const response = await axios.get(`${base_url}/api/admin/all-payout`, { 
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setTransactions(response.data.data);
        // Note: You may need to adjust these based on your actual API response structure
        setTotalPages(Math.ceil(response.data.data.length / limit));
        setTotalTransactions(response.data.data.length);
      } else {
        setTransactions([]);
        setTotalPages(1);
        setTotalTransactions(0);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      toast.error('Failed to fetch payout transactions');
    } finally {
      setLoading(false);
    }
  };

  // Update transaction status
  const updateTransactionStatus = async (id, status) => {
    try {
      const response = await axios.put(`${base_url}/api/admin/change-payout-status/${id}`, 
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        toast.success('Status updated successfully');
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Delete transaction
  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${base_url}/api/admin/payout/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Transaction deleted successfully');
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  // Handle view transaction
  const handleView = (transaction) => {
    setCurrentTransaction(transaction);
    setShowViewModal(true);
  };

  // Handle delete confirmation
  const handleDelete = (transaction) => {
    setCurrentTransaction(transaction);
    setShowDeleteModal(true);
  };

  // Handle status change
  const handleStatusChange = (transaction) => {
    setCurrentTransaction(transaction);
    setStatusUpdate(transaction.status);
    setShowStatusModal(true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Fetch transactions on component mount and filter changes
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, limit, statusFilter, searchQuery]);

  // Status options for dropdown
  const statusOptions = ['pending', 'success', 'rejected'];

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
              <h2 className="text-2xl font-bold text-gray-800">All Payout Transactions</h2>
              <button 
                onClick={fetchTransactions}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaSync /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[5, 10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="relative w-full md:w-1/2">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
                
                <button
                  onClick={resetFilters}
                  className="ml-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Transaction Table */}
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
              ) : transactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No transactions found</p>
                </div>
              ) : (
                <>
                  <div className="shadow border-b border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction._id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.amount} {transaction.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.recipient || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={transaction.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.createdAt ? format(parseISO(transaction.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleView(transaction)}
                                  className="p-2 bg-blue-500 cursor-pointer text-white rounded-md hover:bg-blue-100 transition-colors"
                                  title="View"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  onClick={() => handleStatusChange(transaction)}
                                  className="p-2 bg-purple-500 cursor-pointer text-white rounded-md hover:bg-purple-100 transition-colors"
                                  title="Change Status"
                                >
                                  <FaFilter />
                                </button>
                                <button
                                  onClick={() => handleDelete(transaction)}
                                  className="p-2 bg-red-500 cursor-pointer text-white rounded-md hover:bg-red-100 transition-colors"
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
                            {Math.min(currentPage * limit, totalTransactions)}
                          </span>{' '}
                          of <span className="font-medium">{totalTransactions}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 cursor-pointer py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className={`relative inline-flex items-center cursor-pointer px-4 py-2 border text-sm font-medium ${
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
                            className="relative inline-flex items-center cursor-pointer px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Transaction Details">
        {currentTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
                <p className="mt-1 text-sm text-gray-900">{currentTransaction._id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Amount</label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentTransaction.amount} {currentTransaction.currency}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1 text-sm">
                  <StatusBadge status={currentTransaction.status} />
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Recipient</label>
                <p className="mt-1 text-sm text-gray-900">{currentTransaction.recipient || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentTransaction.createdAt ? format(parseISO(currentTransaction.createdAt), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentTransaction.statusDate ? format(parseISO(currentTransaction.statusDate), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
        {currentTransaction && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Deleting transaction <span className="font-medium">{currentTransaction._id}</span> will permanently remove it from the system.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTransaction(currentTransaction._id);
                  setShowDeleteModal(false);
                }}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Transaction Status">
        {currentTransaction && (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
              <StatusBadge status={currentTransaction.status} />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateTransactionStatus(currentTransaction._id, statusUpdate);
                  setShowStatusModal(false);
                }}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Update Status
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default Allpayout;