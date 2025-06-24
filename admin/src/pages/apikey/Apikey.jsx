import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import logo from '../../assets/logo.png';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Apikey = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    websiteUrl: ''
  });
  const [editingId, setEditingId] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/merchant-key`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMerchants(response.data.merchant);
    } catch (error) {
      toast.error('Failed to fetch merchants');
      console.error('Error fetching merchants:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing merchant
        await axios.put(`${base_url}/api/admin/merchant-key/${editingId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Merchant updated successfully');
      } else {
        // Create new merchant
        await axios.post(`${base_url}/api/admin/merchant-key`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Merchant created successfully');
      }
      setFormData({ name: '', email: '', websiteUrl: '' });
      setEditingId(null);
      fetchMerchants();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Server error');
      }
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (merchant) => {
    setFormData({
      name: merchant.name,
      email: merchant.email,
      websiteUrl: merchant.websiteUrl
    });
    setEditingId(merchant._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${base_url}/api/admin/merchant-key/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          toast.success('Merchant deleted successfully');
          fetchMerchants();
        } catch (error) {
          toast.error('Failed to delete merchant');
          console.error('Error deleting merchant:', error);
        }
      }
    });
  };

  return (
    <section className="font-nunito bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          {/* Merchant Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Update Merchant' : 'Create New Merchant'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ name: '', email: '', websiteUrl: '' });
                      setEditingId(null);
                    }}
                    className="mr-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  {editingId ? 'Update Merchant' : 'Create Merchant'}
                </button>
              </div>
            </form>
          </div>

          {/* Merchants Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Merchants</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {merchants.length > 0 ? (
                    merchants.map((merchant) => (
                      <tr key={merchant._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{merchant.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{merchant.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {merchant.websiteUrl}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{merchant.apiKey}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleEdit(merchant)}
                            className="mr-2 text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(merchant._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No merchants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Apikey;