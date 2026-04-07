import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { leaveAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TempApproverManager = () => {
  const { user } = useAuth();
  const [availableApprovers, setAvailableApprovers] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentTempApprover, setCurrentTempApprover] = useState(null);

  useEffect(() => {
    fetchAvailableApprovers();
    // Set default expiry date to 7 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    setExpiryDate(defaultExpiry.toISOString().split('T')[0]);
  }, []);

  const fetchAvailableApprovers = async () => {
    try {
      // Get available approvers with same or higher role
      const role = user.role === 'hod' ? 'hod' : 'staff';
      const response = await leaveAPI.getAvailableApprovers(role, user.department);
      setAvailableApprovers(response.data.filter(a => a.id !== user.id));
      
      // Check if user already has a substitute
      if (user.substitute_id) {
        const substitute = response.data.find(a => a.id === user.substitute_id);
        setCurrentTempApprover(substitute);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  };

  const handleSetTempApprover = async () => {
    if (!selectedApprover || !expiryDate) {
      setMessage({ type: 'error', text: 'Please select an approver and expiry date' });
      return;
    }

    setLoading(true);
    try {
      await leaveAPI.setTempApprover(selectedApprover, expiryDate);
      setMessage({ type: 'success', text: 'Temporary approver set successfully!' });
      fetchAvailableApprovers();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to set temp approver' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTempApprover = async () => {
    setLoading(true);
    try {
      await leaveAPI.removeTempApprover();
      setMessage({ type: 'success', text: 'Temporary approver removed successfully!' });
      setCurrentTempApprover(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to remove temp approver' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (is_on_leave) => {
    if (is_on_leave) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">On Leave</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Available</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Temporary Approver</h3>
          <p className="text-sm text-gray-500">Assign someone to approve leaves when you're unavailable</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {message.text}
          </p>
        </div>
      )}

      {currentTempApprover ? (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center">
                <span className="text-indigo-700 font-semibold">{currentTempApprover.name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{currentTempApprover.name}</p>
                <p className="text-sm text-gray-600">{currentTempApprover.department} • {currentTempApprover.role}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveTempApprover}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <UserX className="w-4 h-4" />
              {loading ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Substitute Approver
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {availableApprovers.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">No available approvers found</p>
              ) : (
                availableApprovers.map((approver) => (
                  <div
                    key={approver.id}
                    onClick={() => setSelectedApprover(approver.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedApprover === approver.id
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-700 font-medium text-sm">{approver.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{approver.name}</p>
                          <p className="text-xs text-gray-600">{approver.department}</p>
                        </div>
                      </div>
                      {getStatusBadge(approver.is_on_leave)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Expiry Date
              </div>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your substitute will be able to approve leaves until this date
            </p>
          </div>

          <button
            onClick={handleSetTempApprover}
            disabled={loading || !selectedApprover}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserCheck className="w-5 h-5" />
            {loading ? 'Setting...' : 'Set Temporary Approver'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TempApproverManager;
