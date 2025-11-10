import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../utils/api';
import Header from '../components/Header';
import { Icons } from '../assets/icons';
import { motion } from 'framer-motion';

const Timetable = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState('first');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimetable();
  }, [semester]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const data = await studentAPI.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '8:00 AM - 9:00 AM',
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
  ];

  const getTimetableData = () => {
    const courses = profile?.registered_courses?.[`${semester}_semester`] || [];
    const timetable = {};

    days.forEach(day => {
      timetable[day] = {};
    });

    courses.forEach(course => {
      const day = course.schedule?.day;
      const time = course.schedule?.time;
      
      if (day && time && timetable[day]) {
        timetable[day][time] = course;
      }
    });

    return timetable;
  };

  const exportToICS = () => {
    const courses = profile?.registered_courses?.[`${semester}_semester`] || [];
    
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ICRH//Course Timetable//EN\n';
    
    courses.forEach(course => {
      const day = course.schedule?.day;
      const time = course.schedule?.time;
      const venue = course.schedule?.venue;
      
      if (day && time) {
        icsContent += `BEGIN:VEVENT\n`;
        icsContent += `SUMMARY:${course.courseCode} - ${course.courseTitle}\n`;
        icsContent += `DESCRIPTION:Lecturer: ${course.lecturer}\\nVenue: ${venue}\n`;
        icsContent += `LOCATION:${venue}\n`;
        icsContent += `END:VEVENT\n`;
      }
    });
    
    icsContent += 'END:VCALENDAR';
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable_${semester}_semester.ics`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Timetable" />
        <div className="flex items-center justify-center h-96">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  const timetableData = getTimetableData();
  const courses = profile?.registered_courses?.[`${semester}_semester`] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="My Timetable" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                📅 Course Timetable
              </h2>
              <p className="text-gray-600">
                {user?.department} • {user?.level} Level
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setSemester('first')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  semester === 'first'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                First Semester
              </button>
              <button
                onClick={() => setSemester('second')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  semester === 'second'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Second Semester
              </button>
              <button
                onClick={exportToICS}
                className="btn-gold flex items-center space-x-2"
                disabled={courses.length === 0}
              >
                <Icons.Download size={20} />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
          </div>
        </motion.div>

        {courses.length === 0 ? (
          <div className="card text-center py-12">
            <Icons.Calendar size={64} color="#999" className="mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No Courses Registered
            </h3>
            <p className="text-gray-600 mb-4">
              Register your courses to see your timetable
            </p>
            <button
              onClick={() => window.location.href = '/course-selection'}
              className="btn-primary"
            >
              Register Courses
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Timetable */}
            <div className="hidden lg:block card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left font-semibold text-gray-700 border">
                      Time
                    </th>
                    {days.map(day => (
                      <th key={day} className="p-3 text-left font-semibold text-gray-700 border">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(timeSlot => (
                    <tr key={timeSlot}>
                      <td className="p-3 text-sm text-gray-600 border bg-gray-50 font-medium whitespace-nowrap">
                        {timeSlot}
                      </td>
                      {days.map(day => {
                        const course = timetableData[day][timeSlot];
                        return (
                          <td key={`${day}-${timeSlot}`} className="p-2 border">
                            {course ? (
                              <div className="bg-blue-50 border-l-4 border-primary p-3 rounded">
                                <p className="font-bold text-primary text-sm">
                                  {course.courseCode}
                                </p>
                                <p className="text-xs text-gray-700 mb-1">
                                  {course.courseTitle}
                                </p>
                                <p className="text-xs text-gray-600">
                                  📍 {course.schedule?.venue}
                                </p>
                                <p className="text-xs text-gray-600">
                                  👨‍🏫 {course.lecturer}
                                </p>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Timetable */}
            <div className="lg:hidden space-y-4">
              {days.map(day => {
                const dayCourses = Object.entries(timetableData[day]).filter(([_, course]) => course);
                
                if (dayCourses.length === 0) return null;

                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{day}</h3>
                    <div className="space-y-3">
                      {dayCourses.map(([time, course]) => (
                        <div key={time} className="bg-blue-50 border-l-4 border-primary p-4 rounded">
                          <p className="font-bold text-primary mb-1">
                            {course.courseCode}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            {course.courseTitle}
                          </p>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>⏰ {time}</p>
                            <p>📍 {course.schedule?.venue}</p>
                            <p>👨‍🏫 {course.lecturer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Course Legend */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="card mt-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">All Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(course => (
                  <div key={course.courseCode} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {course.courseCode} - {course.courseTitle}
                      </p>
                      <p className="text-sm text-gray-600">
                        {course.units} units • {course.lecturer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Timetable;