import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI, calculateTotalUnits, detectClashes } from '../utils/api';
import Header from '../components/Header';
import { Icons } from '../assets/icons';

const CourseSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [semester, setSemester] = useState(searchParams.get('semester') || 'first');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOverloadWarning, setShowOverloadWarning] = useState(false);
  
  // Token-related state
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [hasCarryoverCourses, setHasCarryoverCourses] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [semester]);

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [coursesData, configData, profile] = await Promise.all([
        studentAPI.getCourses(user.department, user.level, `${semester}_semester`),
        studentAPI.getConfig(),
        studentAPI.getProfile(),
      ]);
      
      setAvailableCourses(coursesData);
      setConfig(configData);

      // Check if already registered
      const existingCourses = profile.registered_courses?.[`${semester}_semester`];
      if (existingCourses && existingCourses.length > 0) {
        setSelectedCourses(existingCourses);
        // Check if already submitted (not just saved)
        if (profile.registration_status?.[`${semester}_semester`] !== 'not_started') {
          setError('You have already registered for this semester. Contact admin to make changes.');
          setShowOverloadWarning(true);
        }
      }
    } catch (err) {
      setError('Failed to load courses. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async () => {
    if (!tokenValue.trim()) {
      setError('Please enter a token');
      return;
    }

    setTokenLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await studentAPI.validateToken(tokenValue);
      
      if (result.type === 'carryover' && result.courses.length > 0) {
        // Auto-populate carryover courses
        setSelectedCourses(result.courses);
        setHasCarryoverCourses(true);
        setSuccess(`✓ ${result.courses.length} carryover courses loaded! You can add more courses within your unit limit.`);
      } else if (result.type === 'late_registration') {
        setSuccess('✓ Late registration unlocked! You can now register courses.');
      }
      
      setShowTokenInput(false);
      setTokenValue('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleCourseToggle = (course) => {
    setError('');
    setSuccess('');
    setShowOverloadWarning(false);

    const isSelected = selectedCourses.some(c => c.courseCode === course.courseCode);
    
    if (isSelected) {
      // Prevent removing carryover courses
      if (hasCarryoverCourses) {
        const carryoverCourse = selectedCourses.find(c => c.courseCode === course.courseCode);
        if (carryoverCourse && carryoverCourse.isCarryover) {
          setError('Cannot remove carryover courses loaded from token');
          return;
        }
      }
      
      // Remove course
      setSelectedCourses(selectedCourses.filter(c => c.courseCode !== course.courseCode));
    } else {
      // Add course
      const newSelection = [...selectedCourses, course];
      const totalUnits = calculateTotalUnits(newSelection);
      const maxUnits = config?.max_units?.[user.level] || 24;

      if (totalUnits > maxUnits) {
        setShowOverloadWarning(true);
        setError(`Total units (${totalUnits}) exceed maximum allowed (${maxUnits}). Please remove a course.`);
      }

      setSelectedCourses(newSelection);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validations
    if (selectedCourses.length === 0) {
      setError('Please select at least one course');
      setSubmitting(false);
      return;
    }

    const totalUnits = calculateTotalUnits(selectedCourses);
    const maxUnits = config?.max_units?.[user.level] || 24;

    if (totalUnits > maxUnits) {
      setError(`Total units (${totalUnits}) exceed maximum allowed (${maxUnits})`);
      setSubmitting(false);
      return;
    }

    // Check for clashes
    const clashes = detectClashes(selectedCourses);
    if (clashes.length > 0) {
      setError(`Timetable clash detected: ${clashes[0].course1} and ${clashes[0].course2} at ${clashes[0].time}`);
      setSubmitting(false);
      return;
    }

    try {
      await studentAPI.registerCourses({
        semester: `${semester}_semester`,
        courses: selectedCourses,
      });

      setSuccess('✓ Courses registered successfully!');
      
      setTimeout(() => {
        navigate('/course-form');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Course Selection" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const totalUnits = calculateTotalUnits(selectedCourses);
  const maxUnits = config?.max_units?.[user.level] || 24;
  const isOverloaded = totalUnits > maxUnits;
  const carryoverCount = selectedCourses.filter(c => c.isCarryover).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Course Registration" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Token Input Button */}
        {!hasCarryoverCourses && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Have a Token?</h3>
                <p className="text-sm text-gray-600">
                  Enter a carryover or late registration token
                </p>
              </div>
              <button
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="btn-outline flex items-center space-x-2"
              >
                <Icons.Token size={20} color="#FFD700" />
                <span>{showTokenInput ? 'Cancel' : 'Enter Token'}</span>
              </button>
            </div>

            {showTokenInput && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Token Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tokenValue}
                    onChange={(e) => setTokenValue(e.target.value)}
                    placeholder="Paste your token here"
                    className="input flex-1"
                  />
                  <button
                    onClick={handleTokenSubmit}
                    disabled={tokenLoading}
                    className="btn-primary px-6 disabled:opacity-50"
                  >
                    {tokenLoading ? 'Validating...' : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Carryover Notice */}
        {hasCarryoverCourses && carryoverCount > 0 && (
          <div className="card mb-6 bg-yellow-50 border-2 border-yellow-300">
            <div className="flex items-start space-x-3">
              <Icons.Warning size={24} color="#FF9800" />
              <div>
                <h3 className="font-bold text-yellow-800">Carryover Courses Loaded</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {carryoverCount} carryover course(s) have been pre-loaded from your token.
                  You can add more courses within your unit limit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Semester Selector */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Semester</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setSemester('first')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                semester === 'first'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              First Semester
            </button>
            <button
              onClick={() => setSemester('second')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                semester === 'second'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Second Semester
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <Icons.Error size={20} color="#DC2626" />
            <p className="text-red-700 text-sm flex-1">{error}</p>
            {showOverloadWarning && (
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900"
              >
                <Icons.Close size={20} color="#DC2626" />
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <Icons.Check size={24} color="#16A34A" />
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Courses */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Icons.Book size={24} color="#0056B3" />
                <span className="ml-2">Available Courses</span>
              </h3>

              {availableCourses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Icons.Warning size={48} color="#999" className="mx-auto mb-4" />
                  <p>No courses available for this semester</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableCourses.map((course) => {
                    const isSelected = selectedCourses.some(c => c.courseCode === course.courseCode);
                    const isCarryover = isSelected && selectedCourses.find(c => c.courseCode === course.courseCode)?.isCarryover;
                    
                    return (
                      <div key={course.courseCode}>
                        <button
                          onClick={() => handleCourseToggle(course)}
                          disabled={isCarryover}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? isCarryover
                                ? 'border-yellow-400 bg-yellow-50 cursor-not-allowed'
                                : 'border-primary bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-bold text-primary text-lg">
                                  {course.courseCode}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  course.isCore
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {course.isCore ? 'CORE' : 'ELECTIVE'}
                                </span>
                                {isCarryover && (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    CARRYOVER
                                  </span>
                                )}
                                <span className="text-sm text-gray-600">
                                  {course.units} {course.units === 1 ? 'Unit' : 'Units'}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-800 mb-1">
                                {course.courseTitle}
                              </h4>
                              <p className="text-sm text-gray-600">
                                👨‍🏫 {course.lecturer}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                📅 {course.schedule?.day} • {course.schedule?.time} • {course.schedule?.venue}
                              </p>
                            </div>
                            <div className="ml-4">
                              {isSelected ? (
                                <div className={`w-6 h-6 ${isCarryover ? 'bg-yellow-500' : 'bg-primary'} rounded-full flex items-center justify-center`}>
                                  <Icons.Check size={16} color="#fff" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Summary Panel */}
          <div>
            <div className="card sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Summary</h3>

              {/* Units Progress */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Units</span>
                  <span className={`font-bold ${isOverloaded ? 'text-red-600' : 'text-primary'}`}>
                    {totalUnits} / {maxUnits}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      isOverloaded ? 'bg-red-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min((totalUnits / maxUnits) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Selected Courses */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">
                  Selected Courses ({selectedCourses.length})
                </h4>
                {selectedCourses.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No courses selected yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedCourses.map((course) => (
                      <div
                        key={course.courseCode}
                        className={`flex items-center justify-between p-2 rounded ${
                          course.isCarryover ? 'bg-yellow-50' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-sm">{course.courseCode}</p>
                          <p className="text-xs text-gray-600">
                            {course.units} units
                            {course.isCarryover && ' • Carryover'}
                          </p>
                        </div>
                        {!course.isCarryover && (
                          <button
                            onClick={() => handleCourseToggle(course)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Icons.Close size={20} color="#EF4444" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedCourses.length === 0 || isOverloaded}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Icons.Check size={20} color="#FFFFFF" />
                    <span>Submit Registration</span>
                  </>
                )}
              </button>

              {isOverloaded && (
                <p className="text-xs text-red-600 mt-2 text-center">
                  Remove courses to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSelection;