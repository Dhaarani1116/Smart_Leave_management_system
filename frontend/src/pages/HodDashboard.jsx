import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, BarChart3, Users, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LeaveTable from '../components/LeaveTable';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { leaveAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const HodDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/apply')) return 'apply';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/conflicts')) return 'conflicts';
    return 'requests';
  };
  
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Leave application form state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
    leaveType: 'personal',
    requesterName: '',
    requesterDepartment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/apply')) setActiveTab('apply');
    else if (path.includes('/analytics')) setActiveTab('analytics');
    else if (path.includes('/conflicts')) setActiveTab('conflicts');
    else setActiveTab('requests');
  }, [location]);

  const fetchData = async () => {
    try {
      const [leavesRes, statsRes, conflictsRes] = await Promise.all([
        leaveAPI.getAllLeaves(),
        leaveAPI.getLeaveStats(),
        leaveAPI.getConflicts()
      ]);
      setLeaves(leavesRes.data);
      setStats(statsRes.data);
      setConflicts(conflictsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, comment) => {
    try {
      await leaveAPI.approveLeave(id, comment);
      fetchData();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleReject = async (id, comment) => {
    try {
      await leaveAPI.rejectLeave(id, comment);
      fetchData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
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
      });
      setShowApplyForm(false);
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      setMessage(error.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  // Get pending leaves for HOD (status is 'Pending' or 'In_Progress' where currentApproverRole is 'hod')
  const getPendingForHOD = () => {
    return leaves.filter(l =>
      (l.status === 'Pending' || l.status === 'In_Progress') &&
      l.currentApproverRole === 'hod'
    );
  };

  // Get forwarded to principal
  const getForwardedToPrincipal = () => {
    return leaves.filter(l =>
      l.status === 'In_Progress' && l.currentApproverRole === 'principal'
    );
  };

  const hodStats = {
    pendingHOD: getPendingForHOD().length,
    forwarded: getForwardedToPrincipal().length,
    totalDept: leaves.length,
    approved: leaves.filter(l => l.status === 'Approved' || l.status === 'Auto_Approved').length,
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending HOD Review</p>
              <p className="text-2xl font-bold text-yellow-600">{hodStats.pendingHOD}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Forwarded to Principal</p>
              <p className="text-2xl font-bold text-blue-600">{hodStats.forwarded}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Department Leaves</p>
              <p className="text-2xl font-bold text-primary-600">{hodStats.totalDept}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="text-primary-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {leaves.filter(l => l.status === 'Approved').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="card border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-orange-600" size={24} />
            <h2 className="text-lg font-semibold text-orange-800">Department Leave Conflicts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {conflicts.slice(0, 3).map((conflict, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                <p className="font-medium text-gray-800">{new Date(conflict.date).toLocaleDateString()}</p>
                <p className="text-orange-600">{conflict.count} students on leave</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Pending HOD Review</h2>
          <button
            onClick={() => setShowApplyForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Apply Leave
          </button>
        </div>
        <LeaveTable
          leaves={getPendingForHOD().slice(0, 5)}
          onApprove={handleApprove}
          onReject={handleReject}
          showActions={true}
          showStudent={true}
        />
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Department Leave Requests</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'all' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'approved' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'rejected' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        <LeaveTable
          leaves={leaves.filter(l => {
            if (activeTab === 'all') return true;
            if (activeTab === 'pending') return l.status === 'Pending';
            if (activeTab === 'in_progress') return l.status === 'In_Progress';
            if (activeTab === 'approved') return l.status === 'Approved' || l.status === 'Auto_Approved';
            if (activeTab === 'rejected') return l.status === 'Rejected';
            return true;
          })}
          onApprove={handleApprove}
          onReject={handleReject}
          showActions={true}
          showStudent={true}
        />
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <AnalyticsDashboard stats={stats} userRole={user?.role} />
    </div>
  );

  const renderConflicts = () => (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Conflicts</h2>
        {conflicts.length === 0 ? (
          <div className="text-center py-12 bg-green-50 rounded-xl">
            <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
            <p className="text-green-700 font-medium">No conflicts detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conflicts.map((conflict, index) => (
              <div key={index} className={`border rounded-xl p-4 ${
                conflict.count >= 5 ? 'border-red-200 bg-red-50' :
                conflict.count >= 3 ? 'border-orange-200 bg-orange-50' :
                'border-yellow-200 bg-yellow-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-800">
                    {new Date(conflict.date).toLocaleDateString()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    conflict.count >= 5 ? 'bg-red-100 text-red-700' :
                    conflict.count >= 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {conflict.count} students
                  </span>
                </div>
                <div className="space-y-1">
                  {conflict.leaves.slice(0, 5).map((leave, idx) => (
                    <p key={idx} className="text-sm text-gray-600">
                      {leave.requester?.name} ({leave.requester?.department})
                    </p>
                  ))}
                  {conflict.leaves.length > 5 && (
                    <p className="text-sm text-gray-400">
                      +{conflict.leaves.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderApplyForm = () => (
    <div className="card max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Apply for Leave</h2>
        <button
          onClick={() => setActiveTab('requests')}
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
          <div></div>
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          {activeTab === 'requests' || ['all', 'pending', 'in_progress', 'approved', 'rejected'].includes(activeTab)
            ? renderRequests()
            : activeTab === 'apply'
            ? renderApplyForm()
            : activeTab === 'analytics'
            ? renderAnalytics()
            : activeTab === 'conflicts'
            ? renderConflicts()
            : renderDashboard()}
        </main>
      </div>
    </div>
  );
};

export default HodDashboard;
