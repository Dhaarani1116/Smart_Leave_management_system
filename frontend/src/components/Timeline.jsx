import React from 'react';
import { motion } from 'framer-motion';
import { User, Users, UserCog, Crown, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const Timeline = ({ status, history = [], requesterRole }) => {
  // Define approval chain based on requester role
  const getApprovalChain = () => {
    switch (requesterRole) {
      case 'student':
        return [
          { role: 'student', label: 'Applied', icon: User },
          { role: 'staff', label: 'Staff Review', icon: Users },
          { role: 'hod', label: 'HOD Approval', icon: UserCog },
        ];
      case 'staff':
        return [
          { role: 'staff', label: 'Applied', icon: User },
          { role: 'hod', label: 'HOD Approval', icon: UserCog },
        ];
      case 'hod':
        return [
          { role: 'hod', label: 'Applied', icon: User },
          { role: 'principal', label: 'Principal Approval', icon: Crown },
        ];
      case 'principal':
        return [
          { role: 'principal', label: 'Applied & Auto-Approved', icon: Crown },
        ];
      default:
        return [
          { role: 'student', label: 'Applied', icon: User },
          { role: 'staff', label: 'Staff Review', icon: Users },
          { role: 'hod', label: 'HOD Approval', icon: UserCog },
        ];
    }
  };

  const chain = getApprovalChain();
  
  // Determine current stage based on status and history
  const getCurrentStage = () => {
    if (status === 'Approved' || status === 'Auto_Approved') {
      return chain.length - 1;
    }
    if (status === 'Rejected') {
      return -1;
    }
    
    if (history && history.length > 0) {
      const lastAction = history[history.length - 1];
      const stageIndex = chain.findIndex(s => s.role === lastAction.role);
      if (stageIndex !== -1) {
        return Math.min(stageIndex + 1, chain.length - 1);
      }
    }
    
    return 0;
  };

  const currentStage = getCurrentStage();
  const isRejected = status === 'Rejected';

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
      <h4 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <ArrowRight size={18} className="text-indigo-500" />
        Approval Timeline
      </h4>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 rounded-full">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: isRejected ? '0%' : `${((currentStage) / (chain.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Stages */}
        <div className="relative flex justify-between">
          {chain.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = index <= currentStage && !isRejected;
            const isCurrent = index === currentStage && !isRejected;
            const isPending = index > currentStage && !isRejected;

            return (
              <motion.div 
                key={stage.role}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 bg-white ${
                    isCompleted 
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/30' 
                      : isRejected && index === 0
                      ? 'border-rose-500 shadow-lg shadow-rose-500/30'
                      : 'border-slate-300'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 1 }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : isRejected && index === 0 ? (
                    <XCircle size={20} className="text-rose-500" />
                  ) : (
                    <Icon size={20} className={isPending ? 'text-slate-400' : 'text-indigo-500'} />
                  )}
                </motion.div>
                
                <div className="mt-3 text-center">
                  <p className={`text-sm font-semibold ${
                    isCompleted ? 'text-emerald-600' : 
                    isRejected ? 'text-rose-600' : 
                    isCurrent ? 'text-indigo-600' : 'text-slate-500'
                  }`}>
                    {stage.label}
                  </p>
                  {isCurrent && !isRejected && (
                    <motion.span 
                      className="text-xs text-indigo-500 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      Current
                    </motion.span>
                  )}
                  {isRejected && index === 0 && (
                    <span className="text-xs text-rose-500 font-medium">Rejected</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {isRejected && (
        <motion.div 
          className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-rose-700 font-medium text-sm">
            This leave request has been rejected
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Timeline;
