import React, { useState, useEffect } from 'react';
import { studentAPI, adminAPI } from '../../utils/api';
import Header from '../../components/Header';
import { Icons } from '../../assets/icons';
import { motion } from 'framer-motion';

const Settings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await studentAPI.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await adminAPI.updateConfig(config);
      setMessage({
        type: 'success',
        text: '✓ Settings saved successfully! Changes will apply immediately.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSemesterToggle = (semester) => {
    setConfig({ ...config, active_semester: semester });
    setMessage({
      type: 'warning',
      text: `⚠️ Remember to click "Save Changes" to apply the ${semester} semester activation!`,
    });
  };

  const handleUnitChange = (level, value) => {
    setConfig({
      ...config,
      max_units: {
        ...config.max_units,
        [level]: parseInt(value) || 24,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Settings" />
        <div className="flex items-center justify-center h-96">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="System Settings" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : message.type === 'warning'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Active Semester Toggle */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Icons.Calendar size={28} color="#0056B3" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Active Semester Control</h3>
                <p className="text-sm text-gray-600">
                  Toggle which semester students can register for
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-primary p-4 rounded mb-6">
              <p className="text-sm text-gray-700">
                <strong>Current Active Semester:</strong>{' '}
                <span className="font-bold text-primary capitalize">
                  {config.active_semester} Semester
                </span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Students can only register courses for the active semester
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleSemesterToggle('first')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  config.active_semester === 'first'
                    ? 'border-primary bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <Icons.Book size={32} color={config.active_semester === 'first' ? '#0056B3' : '#999'} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    First Semester
                  </p>
                  {config.active_semester === 'first' && (
                    <div className="flex items-center justify-center space-x-1">
                      <Icons.Check size={16} color="#4CAF50" />
                      <span className="text-sm font-medium text-green-600">
                        Currently Active
                      </span>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleSemesterToggle('second')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  config.active_semester === 'second'
                    ? 'border-primary bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <Icons.Book size={32} color={config.active_semester === 'second' ? '#0056B3' : '#999'} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    Second Semester
                  </p>
                  {config.active_semester === 'second' && (
                    <div className="flex items-center justify-center space-x-1">
                      <Icons.Check size={16} color="#4CAF50" />
                      <span className="text-sm font-medium text-green-600">
                        Currently Active
                      </span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Maximum Units per Level */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Icons.Calculator size={28} color="#0056B3" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Maximum Units per Level
                </h3>
                <p className="text-sm text-gray-600">
                  Set the maximum course units students can register per semester
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['100', '200', '300', '400', '500'].map((level) => (
                <div key={level}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {level} Level
                  </label>
                  <input
                    type="number"
                    value={config.max_units[level]}
                    onChange={(e) => handleUnitChange(level, e.target.value)}
                    min="12"
                    max="36"
                    className="input-field text-center text-lg font-bold"
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              💡 Typical range: 18-24 units per semester
            </p>
          </div>

          {/* Registration Deadline */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Icons.Warning size={28} color="#FF9800" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Registration Deadline
                </h3>
                <p className="text-sm text-gray-600">
                  Set the last date for course registration
                </p>
              </div>
            </div>

            <input
              type="date"
              value={config.registration_deadline}
              onChange={(e) =>
                setConfig({ ...config, registration_deadline: e.target.value })
              }
              className="input-field max-w-xs"
            />

            <p className="text-sm text-gray-600 mt-3">
              After this date, students will need a late registration token to register
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 text-lg py-4"
          >
            {saving ? (
              <>
                <div className="loader w-5 h-5 border-2"></div>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Icons.Check size={24} />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Warning Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <Icons.Warning size={24} color="#FF9800" />
            <div>
              <h4 className="font-bold text-gray-800 mb-2">⚠️ Important Notice</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Semester changes take effect immediately for all students</li>
                <li>Unit limit changes apply to new registrations only</li>
                <li>Always inform students before changing critical settings</li>
                <li>Make sure to click "Save All Changes" button to apply updates</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;