import React, { useState } from 'react';
import { Check, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import Timeline from './Timeline';

const StatusBadge = ({ status, currentApproverRole }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Pending':
        return { 
          color: 'bg-yellow-100 text-yellow-800', 
          label: currentApproverRole ? `Pending - ${currentApproverRole.toUpperCase()}` : 'Pending'
        };
      case 'In_Progress':
        return { 
          color: 'bg-blue-100 text-blue-800', 
          label: currentApproverRole ? `In Progress - ${currentApproverRole.toUpperCase()}` : 'In Progress'
        };
      case 'Approved':
        return { color: 'bg-green-100 text-green-800', label: 'Approved' };
      case 'Auto_Approved':
        return { color: 'bg-green-100 text-green-800', label: 'Auto-Approved' };
      case 'Rejected':
        return { color: 'bg-red-100 text-red-800', label: 'Rejected' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  const config = getStatusConfig();
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const LeaveTable = ({ 
  leaves, 
  onApprove, 
  onReject, 
  showActions = true,
  showStudent = false 
}) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [actionType, setActionType] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const handleActionClick = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setActionComment('');
  };

  const confirmAction = () => {
    if (actionType === 'approve') {
      onApprove(selectedLeave.id, actionComment);
    } else {
      onReject(selectedLeave.id, actionComment);
    }
    setActionType(null);
    setSelectedLeave(null);
    setActionComment('');
  };

  const toggleExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (leaves.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-500">No leave requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
            </h3>
            <textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              className="input-field mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActionType(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={actionType === 'approve' ? 'btn-success' : 'btn-danger'}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {showStudent && <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>}
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Dates</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Applied On</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaves.map((leave) => (
              <React.Fragment key={leave.id}>
                <tr className="hover:bg-gray-50">
                  {showStudent && (
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{leave.requester?.name || leave.requesterName}</p>
                        <p className="text-sm text-gray-500">{leave.requester?.department || leave.requesterDepartment}</p>
                        {leave.requesterYear && <p className="text-sm text-gray-400">{leave.requesterYear}</p>}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500">
                        {Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1} days
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-sm text-gray-700">{leave.leaveType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={leave.status} currentApproverRole={leave.currentApproverRole} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(leave.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(leave.id)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        {expandedRow === leave.id ? <ChevronUp size={18} /> : <Eye size={18} />}
                      </button>
                      {showActions && leave.status !== 'Approved' && leave.status !== 'Rejected' && (
                        <>
                          <button
                            onClick={() => handleActionClick(leave, 'approve')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleActionClick(leave, 'reject')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRow === leave.id && (
                  <tr>
                    <td colSpan={showStudent ? 6 : 5} className="px-4 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Reason for Leave:</h4>
                          <p className="text-gray-600 text-sm bg-white p-3 rounded-lg border border-gray-200">
                            {leave.reason}
                          </p>
                        </div>
                        <Timeline 
                          status={leave.status} 
                          history={leave.history} 
                          requesterRole={leave.requesterRole}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveTable;
