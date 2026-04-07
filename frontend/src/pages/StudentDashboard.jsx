import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, History, AlertTriangle, CheckCircle, 
  Clock, XCircle, FileText, ChevronRight 
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Timeline from '../components/Timeline';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
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
    const approved = leaves.filter(l => l.status === 'Approved' || l.status === 'Auto_Approved').length;
    const pending = leaves.filter(l => l.status === 'Pending' || l.status === 'In_Progress').length;
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
      return days < 30 && (l.status === 'Approved' || l.status === 'Auto_Approved');
    });
    if (recentLeaves.length > 3) {
      alerts.push({ type: 'info', message: 'High leave frequency this month - consider attendance impact' });
    }
    return alerts;
  };

  const alerts = getSmartAlerts();

  const renderDashboard = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <motion.div 
              key={index} 
              className={`p-4 rounded-lg flex items-center gap-3 ${
                alert.type === 'warning' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AlertTriangle 
                className={alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'} 
                size={20} 
              />
              <p className={`text-sm font-medium ${
                alert.type === 'warning' ? 'text-amber-800' : 'text-blue-800'
              }`}>
                {alert.message}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leaves"
          value={stats.total}
          icon={Calendar}
          color="indigo"
          delay={0}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="emerald"
          delay={0.1}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="amber"
          delay={0.2}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="rose"
          delay={0.3}
        />
      </div>

      <motion.div className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileText className="text-indigo-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Recent Leave Requests</h2>
          </div>
          <motion.button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} />
            Apply Leave
          </motion.button>
        </div>

        {leaves.length === 0 ? (
          <EmptyState
            title="No leave requests yet"
            message="You haven't applied for any leaves. Click the button above to apply."
            icon="calendar"
            action={() => setShowForm(true)}
            actionLabel="Apply Now"
          />
        ) : (
          <div className="space-y-4">
            {leaves.slice(0, 5).map((leave, index) => (
              <motion.div 
                key={leave.id} 
                className="bg-slate-50 rounded-xl p-5 border border-slate-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500 capitalize">{leave.leaveType} Leave</p>
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
                <Timeline status={leave.status} history={leave.history} requesterRole="student" />
              </motion.div>
            ))}

            {leaves.length > 5 && (
              <motion.button
                className="w-full py-3 text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveTab('history')}
              >
                View All History
                <ChevronRight size={18} />
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
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
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <History className="text-indigo-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Leave History</h2>
            <p className="text-sm text-slate-500">All your leave applications</p>
          </div>
        </div>
        
        {leaves.length === 0 ? (
          <EmptyState
            title="No leave history"
            message="You haven't applied for any leaves yet."
            icon="history"
          />
        ) : (
          <div className="space-y-6">
            {leaves.map((leave, index) => (
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
                    <p className="text-slate-500">{leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave</p>
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

                <Timeline status={leave.status} history={leave.history} requesterRole="student" />
              </motion.div>
            ))}
          </div>
        )}
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
                className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
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
          <AnimatePresence mode="wait">
            {activeTab === 'apply' ? (
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

export default StudentDashboard;
