import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import Header from '../../components/Header';
import { Icons } from '../../assets/icons';

const PendingApprovals = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ department: '', level: '', semester: 'all' });
  const [processing, setProcessing] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (matricNumber, semester) => {
    setProcessing(`${matricNumber}-${semester}-approve`);
    try {
      await adminAPI.approveRegistration(matricNumber, semester);
      alert('✅ Registration approved successfully!');
      loadStudents();
    } catch (error) {
      console.error('Approval error:', error);
      alert('❌ Approval failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setProcessing(null);
    }
  };

  const confirmReject = (student, semester) => {
    setRejectTarget({ student, semester });
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;

    const { student, semester } = rejectTarget;
    setProcessing(`${student.matric_number}-${semester}-reject`);
    
    try {
      await adminAPI.rejectRegistration(student.matric_number, semester);
      alert('✅ Registration rejected successfully!');
      setShowRejectModal(false);
      setRejectTarget(null);
      loadStudents();
    } catch (error) {
      console.error('Rejection error:', error);
      alert('❌ Rejection failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setProcessing(null);
    }
  };

  const confirmDelete = (student, semester) => {
    setDeleteTarget({ student, semester });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const { student, semester } = deleteTarget;
    setProcessing(`${student.matric_number}-${semester}-delete`);
    
    try {
      await adminAPI.deleteRegistration(student.matric_number, semester);
      alert('✅ Registration deleted! Student can now re-register.');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      loadStudents();
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Delete failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setProcessing(null);
    }
  };

  const getPendingRegistrations = () => {
    const pending = [];
    
    students.forEach(student => {
      const firstSemStatus = student.registration_status?.first_semester;
      const secondSemStatus = student.registration_status?.second_semester;

      if (firstSemStatus === 'pending' || firstSemStatus === 'approved' || firstSemStatus === 'rejected') {
        const courses = student.registered_courses?.first_semester || [];
        if (courses.length > 0) {
          pending.push({
            ...student,
            semester: 'first_semester',
            status: firstSemStatus,
            courses: courses
          });
        }
      }

      if (secondSemStatus === 'pending' || secondSemStatus === 'approved' || secondSemStatus === 'rejected') {
        const courses = student.registered_courses?.second_semester || [];
        if (courses.length > 0) {
          pending.push({
            ...student,
            semester: 'second_semester',
            status: secondSemStatus,
            courses: courses
          });
        }
      }
    });

    return pending;
  };

  const filteredRegistrations = getPendingRegistrations().filter(reg => {
    if (filter.department && reg.department !== filter.department) return false;
    if (filter.level && reg.level !== filter.level) return false;
    if (filter.semester !== 'all' && reg.semester !== filter.semester) return false;
    return true;
  });

  const stats = {
    pending: filteredRegistrations.filter(r => r.status === 'pending').length,
    approved: filteredRegistrations.filter(r => r.status === 'approved').length,
    rejected: filteredRegistrations.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Pending Approvals" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Course Registration Approvals" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Pending</p>
                <h3 className="text-3xl font-bold">{stats.pending}</h3>
              </div>
              <Icons.Calendar size={48} color="rgba(255,255,255,0.3)" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-400 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Approved</p>
                <h3 className="text-3xl font-bold">{stats.approved}</h3>
              </div>
              <Icons.Check size={48} color="rgba(255,255,255,0.3)" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-400 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm mb-1">Rejected</p>
                <h3 className="text-3xl font-bold">{stats.rejected}</h3>
              </div>
              <Icons.Close size={48} color="rgba(255,255,255,0.3)" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={filter.department}
                onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                className="input"
              >
                <option value="">All Departments</option>
                <option value="CSC">Computer Science</option>
                <option value="ENG">Engineering</option>
                <option value="MED">Medicine</option>
                <option value="LAW">Law</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={filter.level}
                onChange={(e) => setFilter({ ...filter, level: e.target.value })}
                className="input"
              >
                <option value="">All Levels</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                value={filter.semester}
                onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
                className="input"
              >
                <option value="all">All Semesters</option>
                <option value="first_semester">First Semester</option>
                <option value="second_semester">Second Semester</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        <div className="card">
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <Icons.Document size={64} color="#4CAF50" className="mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No Registrations Found
              </h3>
              <p className="text-gray-600">
                There are no course registrations matching your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRegistrations.map((reg, index) => (
                <div
                  key={`${reg.matric_number}-${reg.semester}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-800">
                          {reg.full_name}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            reg.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : reg.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {reg.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Matric:</span> {reg.matric_number}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {reg.department}
                        </div>
                        <div>
                          <span className="font-medium">Level:</span> {reg.level}
                        </div>
                        <div>
                          <span className="font-medium">Semester:</span>{' '}
                          {reg.semester === 'first_semester' ? 'First' : 'Second'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Courses Table */}
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <h5 className="font-semibold text-gray-700 mb-2">
                      Registered Courses ({reg.courses.length})
                    </h5>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="text-left p-2">Code</th>
                            <th className="text-left p-2">Title</th>
                            <th className="text-center p-2">Units</th>
                            <th className="text-center p-2">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reg.courses.map((course) => (
                            <tr key={course.courseCode} className="border-t border-gray-200">
                              <td className="p-2 font-mono">{course.courseCode}</td>
                              <td className="p-2">{course.courseTitle}</td>
                              <td className="p-2 text-center">{course.units}</td>
                              <td className="p-2 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
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
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-right font-semibold text-gray-700">
                      Total Units:{' '}
                      {reg.courses.reduce((sum, c) => sum + (c.units || 0), 0)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3">
                    {reg.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(reg.matric_number, reg.semester)}
                          disabled={processing === `${reg.matric_number}-${reg.semester}-approve`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Icons.Check size={18} color="#FFFFFF" />
                          <span>
                            {processing === `${reg.matric_number}-${reg.semester}-approve`
                              ? 'Approving...'
                              : 'Approve'}
                          </span>
                        </button>
                        <button
                          onClick={() => confirmReject(reg, reg.semester)}
                          disabled={processing === `${reg.matric_number}-${reg.semester}-reject`}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Icons.Close size={18} color="#FFFFFF" />
                          <span>
                            {processing === `${reg.matric_number}-${reg.semester}-reject`
                              ? 'Rejecting...'
                              : 'Reject'}
                          </span>
                        </button>
                      </>
                    )}
                    
                    {/* Delete Button - Available for all statuses */}
                    <button
                      onClick={() => confirmDelete(reg, reg.semester)}
                      disabled={processing === `${reg.matric_number}-${reg.semester}-delete`}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Icons.Delete size={18} color="#FFFFFF" />
                      <span>
                        {processing === `${reg.matric_number}-${reg.semester}-delete`
                          ? 'Deleting...'
                          : 'Delete'}
                      </span>
                    </button>

                    {reg.status === 'approved' && (
                      <span className="text-green-600 font-medium flex items-center space-x-1">
                        <Icons.Check size={18} color="#16A34A" />
                        <span>Approved</span>
                      </span>
                    )}
                    {reg.status === 'rejected' && (
                      <span className="text-red-600 font-medium flex items-center space-x-1">
                        <Icons.Close size={18} color="#DC2626" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Icons.Close size={24} color="#EF4444" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Reject Registration?</h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to reject the course registration for:
            </p>
            
            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="font-semibold text-gray-800">{rejectTarget.student.full_name}</p>
              <p className="text-sm text-gray-600">Matric: {rejectTarget.student.matric_number}</p>
              <p className="text-sm text-gray-600">
                Semester: {rejectTarget.semester === 'first_semester' ? 'First' : 'Second'}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectTarget(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Icons.Warning size={24} color="#EF4444" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Delete Registration?</h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete the course registration for:
            </p>
            
            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="font-semibold text-gray-800">{deleteTarget.student.full_name}</p>
              <p className="text-sm text-gray-600">Matric: {deleteTarget.student.matric_number}</p>
              <p className="text-sm text-gray-600">
                Semester: {deleteTarget.semester === 'first_semester' ? 'First' : 'Second'}
              </p>
              <p className="text-sm text-gray-600">
                Courses: {deleteTarget.student.courses?.length || 0} registered
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will clear all registered courses and reset the status to "Not Started". 
                The student will be able to register again from scratch.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;