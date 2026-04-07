import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  CheckCircle, 
  BarChart3, 
  AlertTriangle,
  Users,
  Bell,
  UserCheck
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          { path: '/student', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/student/apply', icon: FileText, label: 'Apply Leave' },
          { path: '/student/history', icon: History, label: 'Leave History' },
        ];
      case 'staff':
        return [
          { path: '/staff', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/staff/requests', icon: FileText, label: 'Leave Requests' },
          { path: '/staff/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/staff/conflicts', icon: AlertTriangle, label: 'Conflicts' },
          { path: '/staff/temp-approver', icon: UserCheck, label: 'Temp Approver' },
        ];
      case 'hod':
        return [
          { path: '/hod', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/hod/requests', icon: FileText, label: 'Department Requests' },
          { path: '/hod/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/hod/conflicts', icon: AlertTriangle, label: 'Conflicts' },
        ];
      case 'principal':
        return [
          { path: '/principal', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/principal/requests', icon: FileText, label: 'All Requests' },
          { path: '/principal/analytics', icon: BarChart3, label: 'Analytics' },
          { path: '/principal/reports', icon: Users, label: 'Reports' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="text-white" size={24} />
          </div>
          <span className="font-bold text-lg text-gray-800">LeaveMS</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${user?.role}`}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
