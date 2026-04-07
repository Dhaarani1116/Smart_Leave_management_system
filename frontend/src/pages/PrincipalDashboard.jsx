import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, Users, BarChart3, Crown, XCircle, 
  ChevronRight, Clock, AlertTriangle
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LeaveTable from '../components/LeaveTable';
import NoticeBoard from '../components/NoticeBoard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { leaveAPI } from '../services/api';

const PrincipalDashboard = () => {
  const location = useLocation();
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/notices')) return 'notices';
    return 'dashboard';
  };
  
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, leaveId: null, type: null });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/analytics')) setActiveTab('analytics');
    else if (path.includes('/reports')) setActiveTab('reports');
    else if (path.includes('/notices')) setActiveTab('notices');
    else setActiveTab('dashboard');
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

  // Get HOD requests only
  const getHODRequests = () => {
    return leaves.filter(l => 
      (l.requesterRole === 'hod' || l.requester?.role === 'hod')
    );
  };

  const getHODStats = () => {
    const hodRequests = getHODRequests();
    const pending = hodRequests.filter(l => l.status === 'In_Progress' && l.currentApproverRole === 'principal').length;
    const approved = hodRequests.filter(l => l.status === 'Approved' || l.status === 'Auto_Approved').length;
    const rejected = hodRequests.filter(l => l.status === 'Rejected').length;
    const total = hodRequests.length;
    return { pending, approved, rejected, total };
  };

  const hodStats = getHODStats();

  const renderDashboard = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Principal's HOD Requests Summary */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <Crown className="text-amber-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">HOD Leave Requests</h2>
                <p className="text-sm text-slate-500">Review and approve HOD leave applications</p>
              </div>
            </div>
            <motion.button
              onClick={() => setActiveTab('requests')}
              className="text-sm text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
              whileHover={{ x: 2 }}
            >
              View All
              <ChevronRight size={16} />
            </motion.button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total HOD Requests"
              value={hodStats.total}
              icon={Users}
              color="amber"
              delay={0}
            />
            <StatCard
              title="Approved"
              value={hodStats.approved}
              icon={CheckCircle}
              color="emerald"
              delay={0.1}
            />
            <StatCard
              title="Pending"
              value={hodStats.pending}
              icon={Clock}
              color="blue"
              delay={0.2}
            />
            <StatCard
              title="Rejected"
              value={hodStats.rejected}
              icon={XCircle}
              color="rose"
              delay={0.3}
            />
          </div>

          {/* Pending HOD Requests Table */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Pending HOD Requests</h3>
            {hodStats.pending === 0 ? (
              <EmptyState
                title="No pending HOD requests"
                message="There are no HOD leave requests awaiting your approval."
                icon="inbox"
              />
            ) : (
              <LeaveTable
                leaves={getHODRequests().filter(l => l.status === 'In_Progress' && l.currentApproverRole === 'principal').slice(0, 5)}
                onApprove={handleApprove}
                onReject={handleReject}
                showActions={true}
                showStudent={true}
              />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderRequests = () => {
    const hodRequests = getHODRequests();
    
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Crown className="text-amber-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">All HOD Leave Requests</h2>
                  <p className="text-sm text-slate-500">Review and manage all HOD leave applications</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                  <motion.button
                    key={filter}
                    onClick={() => setActiveTab(filter)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                      activeTab === filter 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {filter.replace(/_/g, ' ')}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            <LeaveTable
              leaves={hodRequests.filter(l => {
                if (activeTab === 'all') return true;
                if (activeTab === 'pending') return l.status === 'In_Progress' && l.currentApproverRole === 'principal';
                if (activeTab === 'approved') return l.status === 'Approved' || l.status === 'Auto_Approved';
                if (activeTab === 'rejected') return l.status === 'Rejected';
                return true;
              })}
              onApprove={handleApprove}
              onReject={handleReject}
              showActions={activeTab !== 'approved' && activeTab !== 'rejected'}
              showStudent={true}
            />
            {hodRequests.length === 0 && (
              <EmptyState
                title="No HOD requests"
                message="There are no HOD leave requests to review."
                icon="inbox"
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderAnalytics = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnalyticsDashboard stats={stats} userRole="principal" />
    </motion.div>
  );

  const renderReports = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Department-wise Leave Distribution</h2>
          <div className="space-y-3">
            {Array.from(new Set(leaves.map(l => l.requester?.department).filter(Boolean))).map(dept => {
              const count = leaves.filter(l => l.requester?.department === dept).length;
              const percentage = leaves.length > 0 ? Math.round((count / leaves.length) * 100) : 0;
              return (
                <div key={dept} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">{dept}</span>
                    <span className="font-bold text-slate-800">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Conflict Summary</h2>
          {conflicts.length > 0 ? (
            <div className="space-y-3">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-rose-700 font-medium">{conflicts.length} dates with high absence</p>
                <p className="text-rose-600 text-sm mt-1">
                  {conflicts.reduce((acc, c) => acc + c.count, 0)} total conflicting absences
                </p>
              </div>
              
              <div className="space-y-2">
                {conflicts.slice(0, 5).map((conflict, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-slate-700">
                        {new Date(conflict.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      conflict.count >= 5 ? 'bg-rose-100 text-rose-700' :
                      conflict.count >= 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {conflict.count} students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-emerald-500 mb-2" size={40} />
              <p className="text-emerald-700">No conflicts detected</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderNotices = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <NoticeBoard />
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
                className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
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
            message="Are you sure you want to reject this HOD leave request? This action cannot be undone."
            type="danger"
          />
          <AnimatePresence mode="wait">
            {activeTab === 'requests' || ['all', 'pending', 'approved', 'rejected'].includes(activeTab) ? (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderRequests()}
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
            ) : activeTab === 'reports' ? (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderReports()}
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

export default PrincipalDashboard;
