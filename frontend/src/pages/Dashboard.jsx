import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../utils/api';
import Header from '../components/Header';
import { Icons } from '../assets/icons';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [profileData, configData] = await Promise.all([
        studentAPI.getProfile(),
        studentAPI.getConfig(),
      ]);
      setProfile(profileData);
      setConfig(configData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Dashboard" />
        <div className="flex items-center justify-center h-96">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      icon: <Icons.Book size={32} color="#0056B3" />,
      title: 'Register Courses',
      description: 'Select and register your courses',
      path: '/course-selection',
      color: 'bg-blue-50',
    },
    {
      icon: <Icons.Calendar size={32} color="#FFD700" />,
      title: 'View Timetable',
      description: 'Check your class schedule',
      path: '/timetable',
      color: 'bg-yellow-50',
    },
    {
      icon: <Icons.Document size={32} color="#4CAF50" />,
      title: 'Course Form',
      description: 'View and print registration form',
      path: '/course-form',
      color: 'bg-green-50',
    },
    {
      icon: <Icons.User size={32} color="#FF9800" />,
      title: 'My Profile',
      description: 'Update your information',
      path: '/profile',
      color: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Student Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-8 mb-8 shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Icons.User size={40} color="#FFD700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                {user?.department} Department • {user?.level} Level
              </p>
            </div>
          </div>

          {/* Current Semester Info */}
          <div className="mt-6 pt-6 border-t border-blue-400">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-blue-200 text-sm">Active Semester</p>
                <p className="text-xl font-bold capitalize">
                  {config?.active_semester || 'First'} Semester
                </p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Registration Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.registration_status?.[`${config?.active_semester}_semester`] === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}>
                  {profile?.registration_status?.[`${config?.active_semester}_semester`] === 'approved'
                    ? '✓ Approved'
                    : '⏳ Pending'}
                </span>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Matric Number</p>
                <p className="text-xl font-bold">{user?.matric_number}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => navigate(action.path)}
                  className={`w-full ${action.color} rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200`}
                >
                  <div className="mb-4">{action.icon}</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Registration Summary */}
        {profile?.registered_courses && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 card"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Icons.Info size={24} color="#0056B3" />
              <span className="ml-2">Registration Summary</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Semester */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">First Semester</h4>
                <p className="text-3xl font-bold text-primary">
                  {profile.registered_courses.first_semester?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Courses Registered</p>
                <button
                  onClick={() => navigate('/course-selection?semester=first')}
                  className="mt-3 text-sm text-primary hover:underline flex items-center"
                >
                  <span>View Details</span>
                  <Icons.ArrowRight size={16} />
                </button>
              </div>

              {/* Second Semester */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Second Semester</h4>
                <p className="text-3xl font-bold text-green-600">
                  {profile.registered_courses.second_semester?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Courses Registered</p>
                <button
                  onClick={() => navigate('/course-selection?semester=second')}
                  className="mt-3 text-sm text-green-600 hover:underline flex items-center"
                >
                  <span>View Details</span>
                  <Icons.ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Important Notice */}
        {config?.registration_deadline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg"
          >
            <div className="flex items-start space-x-3">
              <Icons.Warning size={24} color="#FF9800" />
              <div>
                <h4 className="font-bold text-gray-800 mb-1">Registration Deadline</h4>
                <p className="text-gray-700">
                  Course registration closes on{' '}
                  <span className="font-semibold">
                    {new Date(config.registration_deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;