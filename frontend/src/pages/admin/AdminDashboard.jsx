import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import Header from '../../components/Header';
import { Icons } from '../../assets/icons';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await adminAPI.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Admin Dashboard" />
        <div className="flex items-center justify-center h-96">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      icon: <Icons.User size={32} color="#0056B3" />,
      title: 'Manage Students',
      description: 'View and manage all students',
      path: '/admin/students',
      color: 'bg-blue-50',
      count: stats?.total_students || 0,
    },
    {
      icon: <Icons.Check size={32} color="#4CAF50" />,
      title: 'Pending Approvals',
      description: 'Review course registrations',
      path: '/admin/approvals',
      color: 'bg-green-50',
      count: stats?.pending_approvals || 0,
      badge: stats?.pending_approvals > 0,
    },
    {
      icon: <Icons.Book size={32} color="#9C27B0" />,
      title: 'Manage Courses',
      description: 'Add and edit courses',
      path: '/admin/courses',
      color: 'bg-purple-50',
    },
    {
      icon: <Icons.Token size={32} color="#FFD700" />,
      title: 'Generate Tokens',
      description: 'Carryover & Late Registration',
      path: '/admin/tokens',
      color: 'bg-yellow-50',
    },
    {
      icon: <Icons.Document size={32} color="#FF5722" />,
      title: 'Manage Signatures',
      description: 'HOD, Dean, Registrar signatures',
      path: '/admin/signatures',
      color: 'bg-red-50',
    },
    {
      icon: <Icons.Settings size={32} color="#FF9800" />,
      title: 'System Settings',
      description: 'Semester toggle & unit limits',
      path: '/admin/settings',
      color: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Admin Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gold via-gold-dark to-primary text-gray-900 rounded-2xl p-8 mb-8 shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center">
              <Icons.Admin size={40} color="#000" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Control Panel 👑</h1>
              <p className="text-gray-800 text-lg">
                Manage the entire course registration system
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Students</p>
                <p className="text-4xl font-bold">{stats?.total_students || 0}</p>
              </div>
              <Icons.User size={48} color="rgba(255,255,255,0.3)" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card bg-gradient-to-br from-green-500 to-green-600 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Pending Approvals</p>
                <p className="text-4xl font-bold">{stats?.pending_approvals || 0}</p>
              </div>
              <Icons.Warning size={48} color="rgba(255,255,255,0.3)" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Name Changes</p>
                <p className="text-4xl font-bold">{stats?.pending_name_changes || 0}</p>
              </div>
              <Icons.Edit size={48} color="rgba(255,255,255,0.3)" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Departments</p>
                <p className="text-4xl font-bold">
                  {Object.keys(stats?.by_department || {}).length}
                </p>
              </div>
              <Icons.Document size={48} color="rgba(255,255,255,0.3)" />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => navigate(action.path)}
                  className={`w-full ${action.color} rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 relative`}
                >
                  {action.badge && action.count > 0 && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {action.count}
                    </span>
                  )}
                  <div className="mb-4">{action.icon}</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  {action.count !== undefined && !action.badge && (
                    <p className="text-2xl font-bold text-primary mt-2">
                      {action.count}
                    </p>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students by Level */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Icons.Book size={24} color="#0056B3" />
              <span className="ml-2">Students by Level</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.by_level || {}).map(([level, count]) => (
                <div key={level}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {level} Level
                    </span>
                    <span className="text-sm font-bold text-primary">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (count / (stats?.total_students || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Students by Department */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Icons.Dashboard size={24} color="#0056B3" />
              <span className="ml-2">Students by Department</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.by_department || {}).map(([dept, count]) => (
                <div key={dept}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{dept}</span>
                    <span className="text-sm font-bold text-primary">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (count / (stats?.total_students || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity (Placeholder) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="card mt-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Icons.Notification size={24} color="#0056B3" />
            <span className="ml-2">Recent Activity</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Icons.User size={20} color="#0056B3" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {stats?.total_students || 0} students registered in the system
                </p>
                <p className="text-xs text-gray-600">System Overview</p>
              </div>
            </div>
            {stats?.pending_approvals > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Icons.Warning size={20} color="#FF9800" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {stats.pending_approvals} course registrations awaiting approval
                  </p>
                  <p className="text-xs text-gray-600">Action Required</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;