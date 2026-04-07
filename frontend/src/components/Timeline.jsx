import React from 'react';

const Timeline = ({ status, history = [], requesterRole = 'student' }) => {
  // Get approval steps based on requester role
  const getSteps = () => {
    switch (requesterRole) {
      case 'student':
        return [
          { key: 'applied', label: 'Applied', status: 'completed' },
          { key: 'staff', label: 'Staff Review', status: getStepStatus('staff') },
          { key: 'hod', label: 'HOD Review', status: getStepStatus('hod') },
          { key: 'final', label: getFinalLabel(), status: getFinalStatus() },
        ];
      case 'staff':
        return [
          { key: 'applied', label: 'Applied', status: 'completed' },
          { key: 'hod', label: 'HOD Review', status: getStepStatus('hod') },
          { key: 'final', label: getFinalLabel(), status: getFinalStatus() },
        ];
      case 'hod':
        return [
          { key: 'applied', label: 'Applied', status: 'completed' },
          { key: 'principal', label: 'Principal Review', status: getStepStatus('principal') },
          { key: 'final', label: getFinalLabel(), status: getFinalStatus() },
        ];
      case 'principal':
        return [
          { key: 'applied', label: 'Applied', status: 'completed' },
          { key: 'final', label: 'Auto-Approved', status: 'completed' },
        ];
      default:
        return [
          { key: 'applied', label: 'Applied', status: 'completed' },
          { key: 'staff', label: 'Staff Review', status: getStepStatus('staff') },
          { key: 'hod', label: 'HOD Review', status: getStepStatus('hod') },
          { key: 'final', label: getFinalLabel(), status: getFinalStatus() },
        ];
    }
  };

  function getStepStatus(stepRole) {
    // Find the history entry to determine if this step is completed
    const roleApprovals = history.filter(h => 
      h.action?.includes('approved') || h.action?.includes('forwarded')
    );
    
    // Check if this step has been completed based on history
    const stepCompleted = roleApprovals.some(h => 
      h.role === stepRole || 
      (stepRole === 'staff' && h.role === 'staff') ||
      (stepRole === 'hod' && (h.role === 'hod' || h.action?.includes('hod'))) ||
      (stepRole === 'principal' && (h.role === 'principal' || h.action?.includes('principal')))
    );

    // Check if currently at this step
    const currentStepInHistory = history[history.length - 1];
    const isCurrentStep = currentStepInHistory?.role === stepRole || 
      (status === 'Pending' && stepRole === 'staff') ||
      (status === 'In_Progress' && stepRole === getCurrentApproverFromHistory());

    if (status === 'Approved' || status === 'Auto_Approved') {
      return 'completed';
    }
    
    if (status === 'Rejected') {
      const rejectedBy = history.find(h => h.action === 'rejected');
      if (rejectedBy?.role === stepRole) return 'rejected';
      if (stepCompleted) return 'completed';
      return 'pending';
    }

    if (stepCompleted) return 'completed';
    if (isCurrentStep) return 'in-progress';
    return 'pending';
  }

  function getCurrentApproverFromHistory() {
    const lastAction = history[history.length - 1];
    if (!lastAction) return 'staff';
    
    if (lastAction.action?.includes('staff')) return 'hod';
    if (lastAction.action?.includes('hod')) return 'principal';
    return 'staff';
  }

  function getFinalLabel() {
    if (status === 'Approved' || status === 'Auto_Approved') return 'Approved';
    if (status === 'Rejected') return 'Rejected';
    return 'Decision';
  }

  function getFinalStatus() {
    if (status === 'Approved' || status === 'Auto_Approved') return 'completed';
    if (status === 'Rejected') return 'rejected';
    return 'pending';
  }

  const steps = getSteps();

  const getStepColor = (stepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'in-progress':
        return 'bg-yellow-500 border-yellow-500';
      case 'rejected':
        return 'bg-red-500 border-red-500';
      default:
        return 'bg-gray-300 border-gray-300';
    }
  };

  const getStepTextColor = (stepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium border-2 ${getStepColor(
                  step.status
                )}`}
              >
                {index + 1}
              </div>
              <span className={`mt-2 text-xs font-medium ${getStepTextColor(step.status)}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {history.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Approval History:</h4>
          {history.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span className="capitalize">{item.action?.replace(/_/g, ' ') || 'Action'}</span>
              <span className="text-gray-400">by</span>
              <span className="font-medium">{item.actionUser?.name || 'Unknown'}</span>
              <span className="text-gray-400">({item.role})</span>
              {item.comment && (
                <span className="text-gray-400">- &quot;{item.comment}&quot;</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline;
