import React, { useState } from 'react';
import Header from '../../components/Header';
import { Icons } from '../../assets/icons';
import { motion } from 'framer-motion';

const CourseManagement = () => {
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseTitle: '',
    units: 3,
    isCore: true,
    lecturer: '',
    schedule: {
      day: 'Monday',
      time: '9:00 AM - 12:00 PM',
      venue: 'LT1',
    },
  });

  const [semester, setSemester] = useState('first');
  const [level, setLevel] = useState('100');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // In a real app, this would save to backend
    console.log('Adding course:', { ...newCourse, semester, level });
    
    setMessage({
      type: 'success',
      text: `✓ Course ${newCourse.courseCode} added successfully!`,
    });

    // Reset form
    setNewCourse({
      courseCode: '',
      courseTitle: '',
      units: 3,
      isCore: true,
      lecturer: '',
      schedule: {
        day: 'Monday',
        time: '9:00 AM - 12:00 PM',
        venue: 'LT1',
      },
    });
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Course Management" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {message.text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Icons.Plus size={28} color="#0056B3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Add New Course</h2>
              <p className="text-gray-600">Add courses to the system manually</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Semester & Level Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="first">First Semester</option>
                  <option value="second">Second Semester</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                </select>
              </div>
            </div>

            {/* Course Code & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={newCourse.courseCode}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, courseCode: e.target.value })
                  }
                  placeholder="e.g., CSC101"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units *
                </label>
                <input
                  type="number"
                  value={newCourse.units}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, units: parseInt(e.target.value) })
                  }
                  min="1"
                  max="6"
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Course Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={newCourse.courseTitle}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, courseTitle: e.target.value })
                }
                placeholder="e.g., Introduction to Computer Science"
                className="input-field"
                required
              />
            </div>

            {/* Lecturer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lecturer *
              </label>
              <input
                type="text"
                value={newCourse.lecturer}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, lecturer: e.target.value })
                }
                placeholder="e.g., Dr. John Doe"
                className="input-field"
                required
              />
            </div>

            {/* Course Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Type *
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setNewCourse({ ...newCourse, isCore: true })}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    newCourse.isCore
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Core
                </button>
                <button
                  type="button"
                  onClick={() => setNewCourse({ ...newCourse, isCore: false })}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    !newCourse.isCore
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Elective
                </button>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Schedule *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Day</label>
                  <select
                    value={newCourse.schedule.day}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        schedule: { ...newCourse.schedule, day: e.target.value },
                      })
                    }
                    className="input-field"
                    required
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Time</label>
                  <input
                    type="text"
                    value={newCourse.schedule.time}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        schedule: { ...newCourse.schedule, time: e.target.value },
                      })
                    }
                    placeholder="9:00 AM - 12:00 PM"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Venue</label>
                  <input
                    type="text"
                    value={newCourse.schedule.venue}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        schedule: { ...newCourse.schedule, venue: e.target.value },
                      })
                    }
                    placeholder="LT1"
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Icons.Plus size={20} />
              <span>Add Course</span>
            </button>
          </form>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 border-l-4 border-primary p-6 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <Icons.Info size={24} color="#0056B3" />
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Note</h4>
              <p className="text-sm text-gray-700">
                Courses added here will be available immediately for students to register.
                Make sure all information is accurate before submitting.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CourseManagement;