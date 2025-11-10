import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../assets/icons';
import { motion } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    matric_number: '',
    department: 'CSC',
    level: '100',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Only Computer Science for now
  const departments = [
    { code: 'CSC', name: 'Computer Science' }
  ];

  // All levels available (students can join at any level)
  const levels = ['100', '200', '300', '400', '500'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Photo size must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      setFormData({
        ...formData,
        photo: file,
      });

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!formData.photo) {
      setError('Please upload your passport photograph');
      setLoading(false);
      return;
    }

    try {
      // Create FormData
      const submitData = new FormData();
      submitData.append('full_name', formData.full_name);
      submitData.append('matric_number', formData.matric_number);
      submitData.append('department', formData.department);
      submitData.append('level', formData.level);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('password', formData.password);
      submitData.append('photo', formData.photo);

      const result = await register(submitData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md"
        >
          <div className="mb-4 flex justify-center">
            <Icons.Check size={64} color="#4CAF50" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Registration Successful! 🎉
          </h2>
          <p className="text-gray-600 mb-4">
            Redirecting to login page...
          </p>
          <div className="loader mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-blue-900 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/iou_logo.png"
            alt="Igbinedion University"
            className="h-20 w-20 object-contain mx-auto mb-4"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23FFD700" width="100" height="100"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="%230056B3" font-family="Arial" font-weight="bold">IU</text></svg>';
            }}
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Account
          </h1>
          <p className="text-blue-200">
            Computer Science Department
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Icons.User size={28} color="#0056B3" />
            <span className="ml-2">Student Registration</span>
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
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport Photograph *
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Icons.Upload size={32} color="#999" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="btn-outline cursor-pointer inline-block"
                  >
                    Choose Photo
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Max size: 2MB | JPG, PNG
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="input-field"
                required
              />
            </div>

            {/* Matric Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matric Number *
              </label>
              <input
                type="text"
                name="matric_number"
                value={formData.matric_number}
                onChange={handleChange}
                placeholder="e.g., CSC/2020/001"
                className="input-field"
                required
              />
            </div>

            {/* Department (Hidden but always CSC) & Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value="Computer Science"
                  className="input-field bg-gray-50"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Level *
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level} Level
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08012345678"
                  className="input-field"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="input-field"
                  required
                />
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <Icons.Check size={20} />
                  <span>Register</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;