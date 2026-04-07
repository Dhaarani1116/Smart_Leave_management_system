import React from 'react';
import { CheckCircle, Circle, ArrowRight, UserCheck } from 'lucide-react';

const ApprovalChainVisualizer = ({ leave }) => {
  if (!leave) return null;

  const getApprovalChain = (requesterRole) => {
    switch (requesterRole) {
      case 'student':
        return ['staff', 'hod']; // Student: Staff -> HOD (HOD is final)
      case 'staff':
        return ['hod']; // Staff: HOD only (HOD is final)
      case 'hod':
        return ['principal']; // HOD: Principal only (Principal is final)
      case 'principal':
        return ['system']; // Principal: Auto-approved
      default:
        return ['staff', 'hod'];
    }
  };

  const chain = getApprovalChain(leave.requesterRole);
  const currentStatus = leave.status;
  const currentApprover = leave.currentApproverRole;
  
  // Determine completed, current, and pending steps
  const getStepStatus = (role, index) => {
    // Principal auto-approval
    if (leave.requesterRole === 'principal' && role === 'system') {
      return { status: 'completed', label: 'Auto-Approved' };
    }
    
    // Check if this step is completed
    const roleIndex = chain.indexOf(role);
    const currentIndex = chain.indexOf(currentApprover);
    
    if (currentStatus === 'Approved') {
      return { status: 'completed', label: 'Approved' };
    }
    
    if (currentStatus === 'Rejected') {
      if (role === leave.rejectedByRole || (roleIndex <= currentIndex && currentIndex !== -1)) {
        return { status: 'rejected', label: 'Rejected' };
      }
    }
    
    if (role === currentApprover) {
      return { status: 'current', label: 'Pending Approval' };
    }
    
    if (roleIndex < currentIndex) {
      return { status: 'completed', label: 'Approved' };
    }
    
    return { status: 'pending', label: 'Waiting' };
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'staff': return 'Staff';
      case 'hod': return 'HOD (Final)';
      case 'principal': return 'Principal (Final)';
      case 'system': return 'Auto-Approved';
      default: return role;
    }
  };

  const getRoleIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'current':
        return <UserCheck className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'rejected':
        return <Circle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStepClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-300';
      case 'current':
        return 'bg-blue-50 border-blue-300 ring-2 ring-blue-200';
      case 'rejected':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Approval Workflow</h4>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {chain.map((role, index) => {
          const stepStatus = getStepStatus(role, index);
          
          return (
            <React.Fragment key={role}>
              <div className={`flex flex-col items-center min-w-[80px] p-2 rounded-lg border ${getStepClass(stepStatus.status)}`}>
                <div className="mb-1">{getRoleIcon(stepStatus.status)}</div>
                <span className="text-xs font-medium text-gray-700 capitalize">{getRoleLabel(role)}</span>
                <span className="text-[10px] text-gray-500">{stepStatus.label}</span>
                {leave.isTempApprover && role === currentApprover && (
                  <span className="text-[10px] text-orange-600 font-medium mt-1">(Temp)</span>
                )}
              </div>
              {index < chain.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {leave.requesterRole === 'principal' && (
        <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
          Principal leave is auto-approved
        </div>
      )}
      
      {leave.currentApprover && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">Current Approver:</span> {leave.currentApprover.name} ({leave.currentApprover.role})
          {leave.isTempApprover && <span className="text-orange-600 ml-1">(Temporary)</span>}
        </div>
      )}
    </div>
  );
};

export default ApprovalChainVisualizer;
