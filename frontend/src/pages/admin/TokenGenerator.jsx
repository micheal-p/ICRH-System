import React, { useState, useEffect } from 'react';
import { adminAPI, studentAPI } from '../../utils/api';
import Header from '../../components/Header';
import { Icons } from '../../assets/icons';

const TokenGenerator = () => {
  const [tokenType, setTokenType] = useState('carryover');
  const [matricNumber, setMatricNumber] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [semester, setSemester] = useState('first');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load student info when matric number is entered
  const handleMatricChange = async (value) => {
    setMatricNumber(value);
    setStudentInfo(null);
    setAvailableCourses([]);
    setSelectedCourses([]);
    
    if (value.length < 3) return;

    try {
      const students = await adminAPI.getAllStudents();
      const student = students.find(s => s.matric_number === value);
      
      if (student) {
        setStudentInfo(student);
        
        // Load courses for carryover token
        if (tokenType === 'carryover') {
          const courses = await studentAPI.getCourses(
            student.department,
            student.level,
            `${semester}_semester`
          );
          setAvailableCourses(courses);
        }
      }
    } catch (error) {
      console.error('Error loading student:', error);
    }
  };

  // Reload courses when semester changes (for carryover)
  useEffect(() => {
    if (studentInfo && tokenType === 'carryover') {
      loadCoursesForStudent();
    }
  }, [semester, tokenType]);

  const loadCoursesForStudent = async () => {
    if (!studentInfo) return;
    
    try {
      const courses = await studentAPI.getCourses(
        studentInfo.department,
        studentInfo.level,
        `${semester}_semester`
      );
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const toggleCourse = (course) => {
    const isSelected = selectedCourses.some(c => c.courseCode === course.courseCode);
    
    if (isSelected) {
      setSelectedCourses(selectedCourses.filter(c => c.courseCode !== course.courseCode));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleGenerate = async () => {
    if (!matricNumber) {
      setMessage({ type: 'error', text: 'Please enter matric number' });
      return;
    }

    if (!studentInfo) {
      setMessage({ type: 'error', text: 'Student not found' });
      return;
    }

    if (tokenType === 'carryover' && selectedCourses.length === 0) {
      setMessage({ type: 'error', text: 'Please select carryover courses' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await adminAPI.generateToken({
        type: tokenType,
        matric_number: matricNumber,
        courses: tokenType === 'carryover' ? selectedCourses : [],
      });

      setGeneratedToken(result.token);
      setMessage({
        type: 'success',
        text: `✓ ${tokenType === 'carryover' ? 'Carryover' : 'Late Registration'} token generated successfully!`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to generate token',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    setMessage({ type: 'success', text: '✓ Token copied to clipboard!' });
  };

  const totalUnits = selectedCourses.reduce((sum, c) => sum + (c.units || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Token Generator" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Icons.Token size={32} color="#FFD700" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Generate Access Token</h2>
              <p className="text-gray-600">
                Create tokens for carryover courses or late registration
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Token Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Token Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setTokenType('carryover');
                    setSelectedCourses([]);
                    if (studentInfo) loadCoursesForStudent();
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    tokenType === 'carryover'
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Icons.Book size={24} color="#0056B3" />
                    <h3 className="font-bold text-gray-800">Carryover Token</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pre-load specific carryover courses for student
                  </p>
                </button>

                <button
                  onClick={() => {
                    setTokenType('late_registration');
                    setSelectedCourses([]);
                    setAvailableCourses([]);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    tokenType === 'late_registration'
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Icons.Warning size={24} color="#FF9800" />
                    <h3 className="font-bold text-gray-800">Late Registration</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Unlock registration after deadline
                  </p>
                </button>
              </div>
            </div>

            {/* Matric Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Matric Number
              </label>
              <input
                type="text"
                value={matricNumber}
                onChange={(e) => handleMatricChange(e.target.value)}
                placeholder="e.g., CSC/2020/001"
                className="input w-full"
              />
              
              {studentInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ <strong>{studentInfo.full_name}</strong> - {studentInfo.department} - Level {studentInfo.level}
                  </p>
                </div>
              )}
            </div>

            {/* Carryover Course Selection */}
            {tokenType === 'carryover' && studentInfo && (
              <>
                {/* Semester Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Semester for Carryover Courses
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setSemester('first')}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        semester === 'first'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      First Semester
                    </button>
                    <button
                      onClick={() => setSemester('second')}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        semester === 'second'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Second Semester
                    </button>
                  </div>
                </div>

                {/* Course Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Carryover Courses
                    </label>
                    {selectedCourses.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedCourses.length} courses selected ({totalUnits} units)
                      </span>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-2">
                    {availableCourses.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No courses available
                      </p>
                    ) : (
                      availableCourses.map((course) => {
                        const isSelected = selectedCourses.some(
                          (c) => c.courseCode === course.courseCode
                        );

                        return (
                          <button
                            key={course.courseCode}
                            onClick={() => toggleCourse(course)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-primary bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-bold text-primary">
                                    {course.courseCode}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    ({course.units} units)
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      course.isCore
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {course.isCore ? 'Core' : 'Elective'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {course.courseTitle}
                                </p>
                              </div>
                              <div>
                                {isSelected ? (
                                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                    <Icons.Check size={16} color="#fff" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !studentInfo}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Icons.Token size={20} color="#FFFFFF" />
                  <span>Generate Token</span>
                </>
              )}
            </button>

            {/* Generated Token Display */}
            {generatedToken && (
              <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300">
                <p className="text-sm font-medium text-gray-800 mb-2">
                  🎉 Generated Token:
                </p>
                <div className="flex items-center space-x-2 mb-3">
                  <code className="flex-1 bg-white px-4 py-3 rounded font-mono text-sm break-all border border-gray-300">
                    {generatedToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Icons.Document size={20} color="#FFFFFF" />
                    <span>Copy</span>
                  </button>
                </div>

                {tokenType === 'carryover' && selectedCourses.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Pre-loaded Courses ({selectedCourses.length}):
                    </p>
                    <div className="space-y-1">
                      {selectedCourses.map((course) => (
                        <div
                          key={course.courseCode}
                          className="text-xs text-gray-600 flex justify-between"
                        >
                          <span>{course.courseCode} - {course.courseTitle}</span>
                          <span>{course.units} units</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      Total: {totalUnits} units
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-700 mt-3">
                  ⚠️ Share this token securely with the student. It can only be used once.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-l-4 border-primary p-6 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icons.Info size={24} color="#0056B3" />
            <div>
              <h4 className="font-bold text-gray-800 mb-2">How Tokens Work</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>
                  <strong>Carryover Token:</strong> Pre-loads specific courses. Student can still add more courses within unit limit.
                </li>
                <li>
                  <strong>Late Registration Token:</strong> Unlocks registration after deadline. No pre-loaded courses.
                </li>
                <li>Each token is unique and can only be used once</li>
                <li>Students enter tokens during course registration</li>
                <li>All token usage is logged for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenGenerator;