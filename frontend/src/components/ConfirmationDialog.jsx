import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-6 ${isDanger ? 'bg-rose-50' : isWarning ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isDanger ? 'bg-rose-100' : isWarning ? 'bg-amber-100' : 'bg-indigo-100'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                  >
                    {isDanger ? (
                      <AlertTriangle className="text-rose-600" size={24} />
                    ) : (
                      <CheckCircle className={isWarning ? "text-amber-600" : "text-indigo-600"} size={24} />
                    )}
                  </motion.div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDanger ? 'text-rose-800' : isWarning ? 'text-amber-800' : 'text-indigo-800'}`}>
                      {title}
                    </h3>
                    <p className={`text-sm ${isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-indigo-600'}`}>
                      {isDanger ? 'This action cannot be undone' : 'Please confirm your action'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-slate-600 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3 justify-end">
                <motion.button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all ${
                    isDanger
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-rose-500/30 hover:shadow-rose-500/50'
                      : isWarning
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30 hover:shadow-amber-500/50'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-indigo-500/30 hover:shadow-indigo-500/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDanger ? 'Reject' : 'Confirm'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
