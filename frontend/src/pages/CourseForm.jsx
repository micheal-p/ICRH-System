import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, calculateTotalUnits } from '../utils/api';
import Header from '../components/Header';
import { Icons } from '../assets/icons';

const CourseForm = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [signatures, setSignatures] = useState({});
  const [semester, setSemester] = useState('first');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile and registered courses for the selected semester
      const [profileData, coursesData] = await Promise.all([
        studentAPI.getProfile(),
        studentAPI.getRegisteredCourses(`${semester}_semester`).catch(() => null)
      ]);
      
      setProfile(profileData);
      
      // If we got course data, update the profile with it
      if (coursesData) {
        setProfile(prev => ({
          ...prev,
          registered_courses: {
            ...prev.registered_courses,
            [`${semester}_semester`]: coursesData.courses
          },
          registration_status: {
            ...prev.registration_status,
            [`${semester}_semester`]: coursesData.status
          }
        }));
      }
      
      // Fetch signatures (public endpoint - no auth required for viewing)
      try {
        const response = await fetch('http://localhost:5000/api/public/signatures');
        if (response.ok) {
          const sigData = await response.json();
          setSignatures(sigData);
        }
      } catch (error) {
        console.log('Signatures not available');
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Course Form" />
        <div className="flex items-center justify-center h-96">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  const courses = profile?.registered_courses?.[`${semester}_semester`] || [];
  const totalUnits = calculateTotalUnits(courses);
  const isApproved = profile?.registration_status?.[`${semester}_semester`] === 'approved';
  const isPending = profile?.registration_status?.[`${semester}_semester`] === 'pending';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Course Registration Form" showPrint={courses.length > 0} onPrint={handlePrint} />

      <div className="max-w-5xl mx-auto px-4 py-8 no-print">
        {/* Semester Selector */}
        <div className="card mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSemester('first')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                semester === 'first'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              First Semester
            </button>
            <button
              onClick={() => setSemester('second')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                semester === 'second'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Second Semester
            </button>
          </div>
        </div>

        {courses.length === 0 && (
          <div className="card text-center py-12">
            <Icons.Warning size={64} color="#FF9800" className="mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No Courses Registered
            </h3>
            <p className="text-gray-600 mb-4">
              Register your courses for {semester} semester first
            </p>
            <button
              onClick={() => (window.location.href = '/course-selection')}
              className="btn-primary"
            >
              Register Courses
            </button>
          </div>
        )}
      </div>

      {/* Printable Form */}
      {courses.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-8 print-full-width">
          <div className="bg-white border-4 border-primary p-8 print:border-2">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gold">
              <img
                src="/iou_logo.png"
                alt="Igbinedion University"
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  e.target.src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23FFD700" width="100" height="100"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="%230056B3" font-family="Arial" font-weight="bold">IU</text></svg>';
                }}
              />
              <div className="text-center flex-1">
                <h1 className="text-2xl font-bold text-primary mb-1">
                  IGBINEDION UNIVERSITY OKADA
                </h1>
                <h2 className="text-lg font-semibold text-gray-700 mb-1">
                  COURSE REGISTRATION FORM
                </h2>
                <p className="text-sm text-gray-600 capitalize">
                  {semester} Semester {new Date().getFullYear()}/{new Date().getFullYear() + 1}{' '}
                  Academic Session
                </p>
              </div>
              {profile?.photo && (
                <div className="w-20 h-24 border-2 border-gray-300 overflow-hidden">
                  <img
                    src={`http://localhost:5000/${profile.photo}`}
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Student Information */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded">
              <div>
                <p className="text-xs text-gray-600 mb-1">Full Name:</p>
                <p className="font-semibold text-gray-800">{profile?.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Matric Number:</p>
                <p className="font-semibold text-gray-800">{profile?.matric_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Department:</p>
                <p className="font-semibold text-gray-800">{profile?.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Level:</p>
                <p className="font-semibold text-gray-800">{profile?.level}</p>
              </div>
            </div>

            {/* Courses Table */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Registered Courses</h3>
              <table className="w-full border-collapse border-2 border-gray-300">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="border border-gray-300 p-2 text-left text-sm">S/N</th>
                    <th className="border border-gray-300 p-2 text-left text-sm">
                      Course Code
                    </th>
                    <th className="border border-gray-300 p-2 text-left text-sm">
                      Course Title
                    </th>
                    <th className="border border-gray-300 p-2 text-center text-sm">Units</th>
                    <th className="border border-gray-300 p-2 text-center text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={course.courseCode}>
                      <td className="border border-gray-300 p-2 text-sm">{index + 1}</td>
                      <td className="border border-gray-300 p-2 text-sm font-semibold">
                        {course.courseCode}
                      </td>
                      <td className="border border-gray-300 p-2 text-sm">
                        {course.courseTitle}
                      </td>
                      <td className="border border-gray-300 p-2 text-center text-sm">
                        {course.units}
                      </td>
                      <td className="border border-gray-300 p-2 text-center text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            course.isCore
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {course.isCore ? 'Core' : 'Elective'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan="3" className="border border-gray-300 p-2 text-right text-sm">
                      TOTAL UNITS:
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-sm">
                      {totalUnits}
                    </td>
                    <td className="border border-gray-300 p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Approval Status */}
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <div className="flex items-center space-x-3">
                {isApproved ? (
                  <>
                    <Icons.Check size={24} color="#4CAF50" />
                    <div>
                      <p className="font-bold text-green-800">✓ Registration Approved</p>
                      <p className="text-sm text-gray-700">
                        This form has been approved by the authorities
                      </p>
                    </div>
                  </>
                ) : isPending ? (
                  <>
                    <Icons.Warning size={24} color="#FF9800" />
                    <div>
                      <p className="font-bold text-yellow-800">⏳ Awaiting Approval</p>
                      <p className="text-sm text-gray-700">
                        This form is pending administrative approval
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Icons.Warning size={24} color="#9E9E9E" />
                    <div>
                      <p className="font-bold text-gray-800">📝 Not Submitted</p>
                      <p className="text-sm text-gray-700">
                        This registration has not been submitted yet
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Signatures Section */}
            <div className="mt-8 pt-6 border-t-2 border-gray-300">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Approvals</h3>
              
              <div className="grid grid-cols-2 gap-8">
                {/* Course Advisor */}
                <div className="border-2 border-dashed border-gray-300 p-4 rounded h-32 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Course Advisor</p>
                    {signatures.course_advisor?.signature ? (
                      <img
                        src={`http://localhost:5000/${signatures.course_advisor.signature}`}
                        alt="Signature"
                        className="h-12 object-contain"
                      />
                    ) : (
                      <div className="h-12"></div>
                    )}
                  </div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-xs font-semibold text-gray-800">
                      {signatures.course_advisor?.name || '___________________'}
                    </p>
                    <p className="text-xs text-gray-600">Course Advisor</p>
                    <span
                      className={`inline-block px-2 py-1 mt-1 rounded text-xs ${
                        isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* HOD */}
                <div className="border-2 border-dashed border-gray-300 p-4 rounded h-32 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Head of Department</p>
                    {signatures.hod?.signature ? (
                      <img
                        src={`http://localhost:5000/${signatures.hod.signature}`}
                        alt="Signature"
                        className="h-12 object-contain"
                      />
                    ) : (
                      <div className="h-12"></div>
                    )}
                  </div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-xs font-semibold text-gray-800">
                      {signatures.hod?.name || '___________________'}
                    </p>
                    <p className="text-xs text-gray-600">Head of Department</p>
                    <span
                      className={`inline-block px-2 py-1 mt-1 rounded text-xs ${
                        isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Dean */}
                <div className="border-2 border-dashed border-gray-300 p-4 rounded h-32 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Dean of Faculty</p>
                    {signatures.dean?.signature ? (
                      <img
                        src={`http://localhost:5000/${signatures.dean.signature}`}
                        alt="Signature"
                        className="h-12 object-contain"
                      />
                    ) : (
                      <div className="h-12"></div>
                    )}
                  </div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-xs font-semibold text-gray-800">
                      {signatures.dean?.name || '___________________'}
                    </p>
                    <p className="text-xs text-gray-600">Dean of Faculty</p>
                    <span
                      className={`inline-block px-2 py-1 mt-1 rounded text-xs ${
                        isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Registrar */}
                <div className="border-2 border-dashed border-gray-300 p-4 rounded h-32 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Registrar</p>
                    {signatures.registrar?.signature ? (
                      <img
                        src={`http://localhost:5000/${signatures.registrar.signature}`}
                        alt="Signature"
                        className="h-12 object-contain"
                      />
                    ) : (
                      <div className="h-12"></div>
                    )}
                  </div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-xs font-semibold text-gray-800">
                      {signatures.registrar?.name || '___________________'}
                    </p>
                    <p className="text-xs text-gray-600">Registrar</p>
                    <span
                      className={`inline-block px-2 py-1 mt-1 rounded text-xs ${
                        isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-600 pt-4 border-t border-gray-300">
              <p>
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="mt-1">Igbinedion University Okada • Course Registration System</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseForm;