import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, Clock, BarChart3, Users, AlertTriangle, 
  TrendingUp, Plus, XCircle, ChevronRight, GraduationCap, UserCheck, User,
  Calendar
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LeaveTable from '../components/LeaveTable';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import NoticeBoard from '../components/NoticeBoard';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import Timeline from '../components/Timeline';
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
    if (path.includes('/notices')) return 'notices';
    if (path.includes('/history')) return 'history';
    return 'dashboard';
  };
  
  const [leaves, setLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, leaveId: null, type: null });

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
    else if (path.includes('/notices')) setActiveTab('notices');
    else if (path.includes('/history')) setActiveTab('history');
    else if (path.includes('/requests')) setActiveTab('requests');
    else setActiveTab('dashboard');
  }, [location]);

  const fetchData = async () => {
    try {
      const [leavesRes, myLeavesRes, statsRes, conflictsRes] = await Promise.all([
        leaveAPI.getAllLeaves(),
        leaveAPI.getMyLeaves(),
        leaveAPI.getLeaveStats(),
        leaveAPI.getConflicts()
      ]);
      setLeaves(leavesRes.data);
      setMyLeaves(myLeavesRes.data);
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
    setConfirmDialog({ isOpen: true, leaveId: id, type: 'reject', comment });
  };

  const confirmReject = async () => {
    try {
      await leaveAPI.rejectLeave(confirmDialog.leaveId, confirmDialog.comment);
      setConfirmDialog({ isOpen: false, leaveId: null, type: null, comment: '' });
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

  const getMyLeaveStats = () => {
    const total = myLeaves.length;
    const approved = myLeaves.filter(l => l.status === 'Approved' || l.status === 'Auto_Approved').length;
    const pending = myLeaves.filter(l => l.status === 'Pending' || l.status === 'In_Progress').length;
    const rejected = myLeaves.filter(l => l.status === 'Rejected').length;
    return { total, approved, pending, rejected };
  };

  const myStats = getMyLeaveStats();

  const renderDashboard = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* HOD's Own Leave Summary - Like Student Dashboard */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <User className="text-purple-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">My Leave Summary</h2>
                <p className="text-sm text-slate-500">Your personal leave statistics</p>
              </div>
            </div>
            <motion.button
              onClick={() => setActiveTab('apply')}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} />
              Apply Leave
            </motion.button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Leaves"
              value={myStats.total}
              icon={Calendar}
              color="purple"
              delay={0}
            />
            <StatCard
              title="Approved"
              value={myStats.approved}
              icon={CheckCircle}
              color="emerald"
              delay={0.1}
            />
            <StatCard
              title="Pending"
              value={myStats.pending}
              icon={Clock}
              color="amber"
              delay={0.2}
            />
            <StatCard
              title="Rejected"
              value={myStats.rejected}
              icon={XCircle}
              color="rose"
              delay={0.3}
            />
          </div>

          {/* Recent Own Leaves with Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-700">My Recent Leave Requests</h3>
              {myLeaves.length > 3 && (
                <motion.button
                  onClick={() => setActiveTab('history')}
                  className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1"
                  whileHover={{ x: 2 }}
                >
                  View All History
                  <ChevronRight size={16} />
                </motion.button>
              )}
            </div>

            {myLeaves.length === 0 ? (
              <EmptyState
                title="No leave applications"
                message="You haven't applied for any leaves yet. Start by applying for leave."
                icon="calendar"
                action={() => setActiveTab('apply')}
                actionLabel="Apply Now"
              />
            ) : (
              <div className="space-y-4">
                {myLeaves.slice(0, 3).map((leave, index) => (
                  <motion.div 
                    key={leave.id} 
                    className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                          <Calendar className="text-purple-500" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">
                            {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">{leave.leaveType} Leave</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        leave.status === 'Approved' || leave.status === 'Auto_Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        leave.status === 'In_Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {leave.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <Timeline status={leave.status} history={leave.history} requesterRole="hod" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderRequests = () => {
    const studentRequests = leaves.filter(l => l.requester?.role === 'student');
    const staffRequests = leaves.filter(l => l.requester?.role === 'staff');
    
    return (
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* SECTION 1: STUDENT REQUESTS */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <GraduationCap className="text-amber-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Student Leave Requests</h2>
                  <p className="text-sm text-slate-500">Review and manage student leave applications</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                {studentRequests.length} requests
              </span>
            </div>
          </div>

          <div className="p-6">
            {studentRequests.length === 0 ? (
              <EmptyState
                title="No student requests"
                message="There are no student leave requests to review at the moment."
                icon="inbox"
              />
            ) : (
              <LeaveTable
                leaves={studentRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                showActions={true}
                showStudent={true}
              />
            )}
          </div>
        </motion.div>

        {/* SECTION 2: STAFF REQUESTS */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <UserCheck className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Staff Leave Requests</h2>
                  <p className="text-sm text-slate-500">Review and manage staff leave applications</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {staffRequests.length} requests
              </span>
            </div>
          </div>

          <div className="p-6">
            {staffRequests.length === 0 ? (
              <EmptyState
                title="No staff requests"
                message="There are no staff leave requests to review at the moment."
                icon="inbox"
              />
            ) : (
              <LeaveTable
                leaves={staffRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                showActions={true}
                showStudent={true}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

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

  const renderNotices = () => (
    <div className="space-y-6">
      <NoticeBoard />
    </div>
  );

  const renderHistory = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Clock className="text-purple-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">My Leave History</h2>
              <p className="text-sm text-slate-500">All your leave applications and their status</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {myLeaves.length === 0 ? (
            <EmptyState
              title="No leave history"
              message="You haven't applied for any leaves yet."
              icon="history"
              action={() => setActiveTab('apply')}
              actionLabel="Apply Now"
            />
          ) : (
            <div className="space-y-4">
              {myLeaves.map((leave, index) => (
                <motion.div 
                  key={leave.id} 
                  className="bg-slate-50 rounded-xl p-6 border border-slate-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg text-slate-800">
                        {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-slate-500 capitalize">{leave.leaveType} Leave</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      leave.status === 'Approved' || leave.status === 'Auto_Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      leave.status === 'In_Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {leave.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-600 mb-2">Reason:</p>
                    <p className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200">
                      {leave.reason}
                    </p>
                  </div>

                  <Timeline status={leave.status} history={leave.history} requesterRole="hod" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <motion.div
                className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <ConfirmationDialog
            isOpen={confirmDialog.isOpen}
            onClose={() => setConfirmDialog({ isOpen: false, leaveId: null, type: null })}
            onConfirm={confirmReject}
            title="Confirm Rejection"
            message="Are you sure you want to reject this leave request? This action cannot be undone."
            type="danger"
          />
          <AnimatePresence mode="wait">
            {activeTab === 'requests' ? (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderRequests()}
              </motion.div>
            ) : activeTab === 'apply' ? (
              <motion.div
                key="apply"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderApplyForm()}
              </motion.div>
            ) : activeTab === 'history' ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderHistory()}
              </motion.div>
            ) : activeTab === 'analytics' ? (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderAnalytics()}
              </motion.div>
            ) : activeTab === 'conflicts' ? (
              <motion.div
                key="conflicts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderConflicts()}
              </motion.div>
            ) : activeTab === 'notices' ? (
              <motion.div
                key="notices"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderNotices()}
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderDashboard()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default HodDashboard;
