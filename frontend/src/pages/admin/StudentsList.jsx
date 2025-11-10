import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import Header from '../../components/Header';
import { Icons } from '../../assets/icons';
import { motion } from 'framer-motion';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: '',
    level: '',
    search: '',
  });

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, students]);

  const loadStudents = async () => {
    try {
      const data = await adminAPI.getAllStudents();
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    if (filters.department) {
      filtered = filtered.filter(s => s.department === filters.department);
    }

    if (filters.level) {
      filtered = filtered.filter(s => s.level === filters.level);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.full_name.toLowerCase().includes(searchLower) ||
          s.matric_number.toLowerCase().includes(searchLower)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({ department: '', level: '', search: '' });
  };

  const exportToCSV = () => {
    const headers = ['Matric Number', 'Full Name', 'Department', 'Level', 'Email', 'Phone'];
    const rows = filteredStudents.map(s => [
      s.matric_number,
      s.full_name,
      s.department,
      s.level,
      s.email || '',
      s.phone || '',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Students List" />
        <div className="flex items-center justify-center h-96">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  const departments = [...new Set(students.map(s => s.department))];
  const levels = [...new Set(students.map(s => s.level))].sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Students Management" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Student
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  placeholder="Name or Matric Number..."
                  className="input-field pl-10"
                />
                <Icons.Search
                  size={20}
                  color="#999"
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            {/* Department */}
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={filters.department}
                onChange={e => handleFilterChange('department', e.target.value)}
                className="input-field"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={filters.level}
                onChange={e => handleFilterChange('level', e.target.value)}
                className="input-field"
              >
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level} Level
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button onClick={clearFilters} className="btn-secondary">
                Clear
              </button>
              <button
                onClick={exportToCSV}
                className="btn-gold flex items-center space-x-2"
              >
                <Icons.Download size={20} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredStudents.length}</span> of{' '}
              <span className="font-semibold">{students.length}</span> students
            </p>
          </div>
        </motion.div>

        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card overflow-x-auto"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Photo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Matric Number
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Full Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Department
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Level</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Contact
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <Icons.User size={48} color="#999" className="mx-auto mb-4" />
                    <p className="text-gray-600">No students found</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr
                    key={student.matric_number}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        {student.photo ? (
                          <img
                            src={`http://localhost:5000/${student.photo}`}
                            alt={student.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icons.User size={24} color="#999" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {student.matric_number}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{student.full_name}</p>
                      {student.profile_edit_pending && (
                        <span className="text-xs text-yellow-600">
                          ⚠️ Name change pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{student.department}</td>
                    <td className="py-3 px-4 text-gray-600">{student.level}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <p>{student.email || 'N/A'}</p>
                      <p>{student.phone || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            student.registration_status?.first_semester === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          1st: {student.registration_status?.first_semester || 'pending'}
                        </span>
                        <br />
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            student.registration_status?.second_semester === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          2nd: {student.registration_status?.second_semester || 'pending'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/student/${student.matric_number}`)
                        }
                        className="text-primary hover:text-primary-dark transition-colors"
                        title="View Details"
                      >
                        <Icons.Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentsList;