import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Users, BarChart3, PieChart, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LeaveTable from '../components/LeaveTable';
import { leaveAPI } from '../services/api';

const PrincipalDashboard = () => {
  const location = useLocation();
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/reports')) return 'reports';
    return 'requests';
  };
  
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/analytics')) setActiveTab('analytics');
    else if (path.includes('/reports')) setActiveTab('reports');
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

  const getPrincipalStats = () => {
    const pendingPrincipal = leaves.filter(l => l.status === 'In_Progress' && l.currentApproverRole === 'principal').length;
    const approved = leaves.filter(l => l.status === 'Approved' || l.status === 'Auto_Approved').length;
    const rejected = leaves.filter(l => l.status === 'Rejected').length;
    const total = leaves.length;
    return { pendingPrincipal, approved, rejected, total };
  };

  const principalStats = getPrincipalStats();

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Final Review</p>
              <p className="text-2xl font-bold text-yellow-600">{principalStats.pendingPrincipal}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FileText className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Approved</p>
              <p className="text-2xl font-bold text-green-600">{principalStats.approved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Rejected</p>
              <p className="text-2xl font-bold text-red-600">{principalStats.rejected}</p>
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
              <p className="text-2xl font-bold text-primary-600">{principalStats.total}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="text-primary-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">HOD Leave Requests (Pending Principal Approval)</h2>
          <LeaveTable
            leaves={leaves.filter(l => l.status === 'In_Progress' && l.currentApproverRole === 'principal').slice(0, 5)}
            onApprove={handleApprove}
            onReject={handleReject}
            showActions={true}
            showStudent={true}
          />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">College Overview</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Approval Rate</span>
                <span className="text-2xl font-bold text-green-600">
                  {principalStats.total > 0 
                    ? Math.round((principalStats.approved / principalStats.total) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${principalStats.total > 0 ? (principalStats.approved / principalStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rejection Rate</span>
                <span className="text-2xl font-bold text-red-600">
                  {principalStats.total > 0 
                    ? Math.round((principalStats.rejected / principalStats.total) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${principalStats.total > 0 ? (principalStats.rejected / principalStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Rate</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {principalStats.total > 0 
                    ? Math.round((leaves.filter(l => l.status.includes('Pending')).length / principalStats.total) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${principalStats.total > 0 ? (leaves.filter(l => l.status.includes('Pending')).length / principalStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">All Leave Requests</h2>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveTab(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                  activeTab === filter ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <LeaveTable
          leaves={leaves.filter(l => {
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
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <AnalyticsDashboard stats={stats} userRole="principal" />
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Department-wise Leave Distribution</h2>
          <div className="space-y-3">
            {Array.from(new Set(leaves.map(l => l.requester?.department).filter(Boolean))).map(dept => {
              const count = leaves.filter(l => l.requester?.department === dept).length;
              const percentage = leaves.length > 0 ? Math.round((count / leaves.length) * 100) : 0;
              return (
                <div key={dept} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">{dept}</span>
                    <span className="font-bold text-gray-800">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Conflict Summary</h2>
          {conflicts.length > 0 ? (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{conflicts.length} dates with high absence</p>
                <p className="text-red-600 text-sm mt-1">
                  {conflicts.reduce((acc, c) => acc + c.count, 0)} total conflicting absences
                </p>
              </div>
              
              <div className="space-y-2">
                {conflicts.slice(0, 5).map((conflict, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        {new Date(conflict.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      conflict.count >= 5 ? 'bg-red-100 text-red-700' :
                      conflict.count >= 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {conflict.count} students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={40} />
              <p className="text-green-700">No conflicts detected</p>
            </div>
          )}
        </div>
      </div>
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
          {activeTab === 'requests' || ['all', 'pending', 'approved', 'rejected'].includes(activeTab)
            ? renderRequests() 
            : activeTab === 'analytics' ? renderAnalytics() 
            : activeTab === 'reports' ? renderReports() 
            : renderDashboard()}
        </main>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
