import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, FileText, Calendar, Search } from 'lucide-react';

const EmptyState = ({ 
  title = "No data found", 
  message = "There are no items to display at the moment.",
  icon = 'inbox',
  action = null,
  actionLabel = "Take Action"
}) => {
  const icons = {
    inbox: Inbox,
    file: FileText,
    calendar: Calendar,
    search: Search,
  };

  const Icon = icons[icon] || Inbox;

  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <Icon size={40} className="text-slate-400" />
      </motion.div>

      <motion.h3 
        className="text-xl font-bold text-slate-700 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h3>

      <motion.p 
        className="text-slate-500 text-center max-w-sm mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {message}
      </motion.p>

      {action && (
        <motion.button
          onClick={action}
          className="btn-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
