import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../assets/icons';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    matric_number: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      navigate(isAdmin() ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);

      if (result.success) {
        // Redirect based on user type
        if (result.user.is_admin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
           <img
  src="/iou_logo.png"
  alt="Igbinedion University Okada"
  className="h-32 w-32 object-contain drop-shadow-2xl"
/>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-blue-200">
            Course Registration Helper
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Icons.User size={28} color="#0056B3" />
            <span className="ml-2">Login</span>
          </h2>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2"
            >
              <Icons.Error size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Matric Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matric Number
              </label>
              <input
                type="text"
                name="matric_number"
                value={formData.matric_number}
                onChange={handleChange}
                placeholder="e.g., CSC/2020/001"
                className="input-field"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <Icons.Eye size={20} color="#666" />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="loader w-5 h-5 border-2"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Icons.ArrowRight size={20} />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary font-semibold hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>

          {/* Quick Test Login Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Admin Login: ADMIN001 / admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-blue-200 text-sm">
          <p>© 2024 Igbinedion University</p>
          <p className="mt-1">Powered by ICRH System</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;