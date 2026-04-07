import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, Users, Calendar, BarChart3, UserCheck, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LeaveTable from '../components/LeaveTable';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import TempApproverManager from '../components/TempApproverManager';
import { leaveAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StaffDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/conflicts')) return 'conflicts';
    if (path.includes('/temp-approver')) return 'temp-approver';
    return 'requests';
  };
  
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState(getInitialTab());
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
    if (path.includes('/analytics')) setActiveTab('analytics');
    else if (path.includes('/conflicts')) setActiveTab('conflicts');
    else if (path.includes('/temp-approver')) setActiveTab('temp-approver');
    else setActiveTab('requests');
  }, [location]);

  const fetchData = async () => {
    try {
      const [leavesRes, conflictsRes, statsRes] = await Promise.all([
        leaveAPI.getPendingApprovals(),
        leaveAPI.getConflicts(),
        leaveAPI.getLeaveStats()
      ]);
      setLeaves(leavesRes.data);
      setConflicts(conflictsRes.data);
      setStats(statsRes.data);
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
      setMessage(error.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStats = () => {
    const pending = leaves.filter(l => l.status === 'Pending').length;
    const inProgress = leaves.filter(l => l.status === 'In_Progress').length;
    const approved = leaves.filter(l => l.status === 'Approved' || l.status === 'Auto_Approved').length;
    const rejected = leaves.filter(l => l.status === 'Rejected').length;
    return { pending, inProgress, approved, rejected, total: leaves.length };
  };

  const statsSummary = getStats();

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{statsSummary.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Forwarded</p>
              <p className="text-2xl font-bold text-blue-600">{statsSummary.inProgress}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{statsSummary.rejected}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold text-gray-800">{statsSummary.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="text-gray-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="card border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-orange-600" size={24} />
            <h2 className="text-lg font-semibold text-orange-800">Leave Conflicts Detected</h2>
          </div>
          <p className="text-orange-700 mb-4">
            Multiple students have applied for leave on the following dates. Review carefully.
          </p>
          <div className="space-y-2">
            {conflicts.slice(0, 3).map((conflict, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {new Date(conflict.date).toLocaleDateString()}
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {conflict.count} students
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Pending Leave Requests</h2>
          <button
            onClick={() => setShowApplyForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Apply Leave
          </button>
        </div>
        <LeaveTable
          leaves={leaves}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={loading}
        />
      </div>

      {showApplyForm && (
        <div className="card max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Apply for Leave</h2>
            <button
              onClick={() => setShowApplyForm(false)}
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
      )}
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">All Leave Requests</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'requests' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
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
          </div>
        </div>

        <LeaveTable
          leaves={activeTab === 'pending' ? leaves.filter(l => l.status === 'Pending') : leaves}
          onApprove={handleApprove}
          onReject={handleReject}
          showActions={true}
          showStudent={true}
        />
      </div>
    </div>
  );

  const renderConflicts = () => (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Conflict Detection</h2>
        
        {conflicts.length === 0 ? (
          <div className="text-center py-12 bg-green-50 rounded-xl">
            <CheckCircle className="mx-auto text-green-500 mb-3" size={48} />
            <p className="text-green-700 font-medium">No conflicts detected</p>
            <p className="text-green-600 text-sm">Leave distribution is balanced</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map((conflict, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-primary-600" size={20} />
                    <span className="font-medium text-gray-800">
                      {new Date(conflict.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    conflict.count >= 5 ? 'bg-red-100 text-red-700' :
                    conflict.count >= 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {conflict.count} students absent
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Students on leave:</p>
                  <div className="space-y-1">
                    {conflict.leaves.map((leave, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{leave.requester?.name}</span>
                        <span className="text-gray-400">{leave.requester?.class}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <AnalyticsDashboard stats={stats} userRole={user?.role} />
    </div>
  );

  const renderTempApprover = () => (
    <div className="space-y-6">
      <TempApproverManager />
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
          {activeTab === 'requests' ? renderRequests() : 
           activeTab === 'pending' ? renderRequests() :
           activeTab === 'analytics' ? renderAnalytics() :
           activeTab === 'conflicts' ? renderConflicts() : 
           activeTab === 'temp-approver' ? renderTempApprover() :
           renderDashboard()}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
