import React, { useState, useEffect } from 'react';
import { Plus, Calendar, History, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Timeline from '../components/Timeline';
import { leaveAPI } from '../services/api';

const StudentDashboard = () => {
  const location = useLocation();
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/apply')) return 'apply';
    if (path.includes('/history')) return 'history';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
    leaveType: 'personal',
    requesterName: '',
    requesterDepartment: '',
    requesterYear: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/apply')) setActiveTab('apply');
    else if (path.includes('/history')) setActiveTab('history');
    else setActiveTab('dashboard');
  }, [location]);

  const fetchLeaves = async () => {
    try {
      const response = await leaveAPI.getMyLeaves();
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await leaveAPI.applyLeave(formData);
      setMessage('Leave application submitted successfully!');
      setFormData({ 
        fromDate: '', 
        toDate: '', 
        reason: '', 
        leaveType: 'personal',
        requesterName: '',
        requesterDepartment: '',
        requesterYear: '',
      });
      setShowForm(false);
      fetchLeaves();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveStats = () => {
    const total = leaves.length;
    const approved = leaves.filter(l => l.status === 'Approved').length;
    const pending = leaves.filter(l => l.status.includes('Pending')).length;
    const rejected = leaves.filter(l => l.status === 'Rejected').length;
    return { total, approved, pending, rejected };
  };

  const stats = getLeaveStats();

  const getSmartAlerts = () => {
    const alerts = [];
    if (stats.total > 5) {
      alerts.push({ type: 'warning', message: 'You have applied for multiple leaves recently' });
    }
    const recentLeaves = leaves.filter(l => {
      const days = (new Date() - new Date(l.fromDate)) / (1000 * 60 * 60 * 24);
      return days < 30 && l.status === 'Approved';
    });
    if (recentLeaves.length > 3) {
      alerts.push({ type: 'info', message: 'High leave frequency this month - consider attendance impact' });
    }
    return alerts;
  };

  const alerts = getSmartAlerts();

  const renderDashboard = () => (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className={`p-4 rounded-lg flex items-center gap-3 ${
              alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              <AlertTriangle className={alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'} size={20} />
              <p className={`text-sm ${alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}`}>
                {alert.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Leaves</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <History className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Recent Leave Requests</h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Apply Leave
          </button>
        </div>

        {leaves.slice(0, 5).map((leave) => (
          <div key={leave.id} className="border-b border-gray-100 last:border-0 py-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-800">
                  {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 capitalize">{leave.leaveType} Leave</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {leave.status.replace(/_/g, ' ')}
              </span>
            </div>
            <Timeline status={leave.status} history={leave.history} requesterRole="student" />
          </div>
        ))}

        {leaves.length === 0 && (
          <p className="text-center text-gray-500 py-8">No leave requests yet</p>
        )}
      </div>
    </div>
  );

  const renderApplyForm = () => (
    <div className="card max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Apply for Leave</h2>
        <button
          onClick={() => setShowForm(false)}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('success') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.requesterName}
              onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
              className="input-field"
              required
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={formData.requesterDepartment}
              onChange={(e) => setFormData({ ...formData, requesterDepartment: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Department</option>
              <option value="CSE">CSE</option>
              <option value="CSE (AIML)">CSE (AIML)</option>
              <option value="AI & DS">AI & DS</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
              <option value="CCE">CCE</option>
              <option value="CSBS">CSBS</option>
              <option value="CSE (CYBER)">CSE (CYBER)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={formData.requesterYear}
              onChange={(e) => setFormData({ ...formData, requesterYear: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="input-field"
              required
            >
              <option value="personal">Personal</option>
              <option value="medical">Medical</option>
              <option value="academic">Academic</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={formData.fromDate}
              onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={formData.toDate}
              onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="input-field"
            rows={4}
            placeholder="Please provide a detailed reason for your leave..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary py-3"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );

  const renderHistory = () => (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Leave History</h2>
      
      {leaves.map((leave) => (
        <div key={leave.id} className="border-b border-gray-100 last:border-0 py-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-medium text-lg text-gray-800">
                {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
              </p>
              <p className="text-gray-500">{leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
              leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {leave.status.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <span className="font-medium">Reason:</span> {leave.reason}
            </p>
          </div>

          <Timeline status={leave.status} history={leave.history} />
        </div>
      ))}

      {leaves.length === 0 && (
        <p className="text-center text-gray-500 py-8">No leave history available</p>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          {activeTab === 'apply' ? renderApplyForm() : 
           activeTab === 'history' ? renderHistory() : 
           renderDashboard()}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
