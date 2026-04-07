import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'indigo',
  trend = null,
  trendLabel = '',
  delay = 0 
}) => {
  const colors = {
    indigo: {
      bg: 'from-indigo-500 to-violet-500',
      light: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      shadow: 'shadow-indigo-500/20',
    },
    emerald: {
      bg: 'from-emerald-500 to-teal-500',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      shadow: 'shadow-emerald-500/20',
    },
    amber: {
      bg: 'from-amber-500 to-orange-500',
      light: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      shadow: 'shadow-amber-500/20',
    },
    rose: {
      bg: 'from-rose-500 to-pink-500',
      light: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      shadow: 'shadow-rose-500/20',
    },
    blue: {
      bg: 'from-blue-500 to-cyan-500',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      shadow: 'shadow-blue-500/20',
    },
    purple: {
      bg: 'from-purple-500 to-fuchsia-500',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      shadow: 'shadow-purple-500/20',
    },
  };

  const theme = colors[color] || colors.indigo;

  const getTrendIcon = () => {
    if (trend === null) return null;
    if (trend > 0) return <TrendingUp size={16} className="text-emerald-500" />;
    if (trend < 0) return <TrendingDown size={16} className="text-rose-500" />;
    return <Minus size={16} className="text-slate-400" />;
  };

  return (
    <motion.div
      className={`relative overflow-hidden bg-white rounded-2xl p-6 border ${theme.border} shadow-lg ${theme.shadow} hover:shadow-xl transition-shadow duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      {/* Background Gradient Decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.bg} opacity-10 rounded-full -mr-10 -mt-10 blur-2xl`} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <motion.h3 
            className="text-3xl font-bold text-slate-800"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
          >
            {value}
          </motion.h3>
          
          {trend !== null && (
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon()}
              <span className={`text-xs font-medium ${
                trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-500'
              }`}>
                {Math.abs(trend)}% {trendLabel}
              </span>
            </div>
          )}
        </div>

        <motion.div 
          className={`w-14 h-14 rounded-2xl ${theme.light} flex items-center justify-center`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.1, type: "spring", stiffness: 200 }}
        >
          <Icon size={28} className={theme.text} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatCard;
