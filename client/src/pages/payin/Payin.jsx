import React, { useState } from 'react'
import Header from '../../components/common/Header'
import Sidebar from '../../components/common/Sidebar';
import { FiSearch } from 'react-icons/fi';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Payin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSubmit = async () => {
    if (!paymentId.trim() && !trxId.trim()) {
      toast.error("At least one search parameter (Payment ID or TrxID) is required!");
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);
      toast.loading('Filtering transactions...');
      
      const response = await axios.post(`${base_url}/api/user/filter-transaction`, {
        paymentId: paymentId.trim(),
        trxId: trxId.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }});

      setTransactions(response.data.transactions || []);
      toast.dismiss();
      if (response.data.transactions.length === 0) {
        toast.error('No transactions found!');
      } else {
        toast.success(`Found ${response.data.transactions.length} transactions`);
      }
    } catch (error) {
      toast.dismiss();
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error fetching transactions");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex h-screen font-jost overflow-hidden">
      {/* Sidebar */}
      <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content */}
      <section className="flex-1 w-full h-screen overflow-y-auto">
        <Header toggleSidebar={toggleSidebar} />
        {/* Your scrollable content below header */}
        <div className="mx-auto px-4 py-8">
          <Toaster />
          <h1 className="text-2xl font-bold mb-6">Transaction</h1>

          <div className="border rounded-lg shadow-sm border-gray-200">
            <div className="text-lg font-semibold mb-4 bg-gray-100 px-[20px] py-[5px]">Pay In</div>

            <div className="grid md:grid-cols-2 gap-4 mb-6 px-6 py-3">
              <div>
                <label className="block mb-1 text-sm font-medium">Payment ID</label>
                <input
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="Enter Payment ID"
                  className="w-full px-4 py-2 border rounded-md focus:ring border-gray-200 focus:ring-green-300"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">TrxID</label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="Enter TrxID"
                  className="w-full px-4 py-2 border rounded-md focus:ring border-gray-200 focus:ring-green-300"
                />
              </div>
            </div>

            <div className="flex justify-center px-3 pb-6">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full flex items-center gap-2 transition disabled:opacity-70"
              >
                <FiSearch />
                {isLoading ? 'Filtering...' : 'Filter'}
              </button>
            </div>
          </div>

          <div className="mt-6 bg-white p-6 border rounded shadow-sm border-gray-200 ">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : hasSearched && transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-6">No transactions found matching your criteria</p>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto border-[2px] border-gray-200">
                <table className="w-full text-left table-auto border-t border-gray-200 ">
                  <thead>
                    <tr className="text-sm text-gray-600 border-b-[2px] border-gray-200">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Payment ID</th>
                      <th className="py-2 px-2">TrxID</th>
                      <th className="py-2 px-2">Amount</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn, index) => (
                      <tr key={index} className=" hover:bg-gray-50 border-gray-200">
                        <td className="py-3 px-2">{index + 1}</td>
                        <td className="py-3 px-2">{txn.paymentId || 'N/A'}</td>
                        <td className="py-3 px-2">{txn.transactionId || 'N/A'}</td>
                        <td className="py-3 px-2">৳ {txn.expectedAmount || txn.receivedAmount || '0'}</td>
                        <td className={`py-3 px-2 font-medium ${
                          txn.status === 'completed' ? 'text-green-600' : 
                          txn.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {txn.status || 'N/A'}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-500">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6">
                Enter search criteria and click Filter to find transactions
              </p>
            )}
          </div>
        </div>
      </section>
    </section>
  )
}

export default Payin