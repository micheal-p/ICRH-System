import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import Header from '../../components/Header';
import { Icons } from '../../assets/icons';
import { motion } from 'framer-motion';

const Signatures = () => {
  const [signatures, setSignatures] = useState({});
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ role: '', name: '', signature: null });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const roles = [
    { key: 'hod', label: 'Head of Department' },
    { key: 'dean', label: 'Dean of Faculty' },
    { key: 'registrar', label: 'Registrar' },
    { key: 'course_advisor', label: 'Course Advisor' },
  ];

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    try {
      const data = await adminAPI.getSignatures();
      setSignatures(data);
    } catch (error) {
      console.error('Error loading signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const submitData = new FormData();
    submitData.append('role', formData.role);
    submitData.append('name', formData.name);
    if (formData.signature) {
      submitData.append('signature', formData.signature);
    }

    try {
      await adminAPI.saveSignature(submitData);
      setMessage({ type: 'success', text: '✓ Signature saved successfully!' });
      setEditing(null);
      setFormData({ role: '', name: '', signature: null });
      await loadSignatures();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save signature',
      });
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete signature for ${role}?`)) return;

    try {
      await adminAPI.deleteSignature(role);
      setMessage({ type: 'success', text: '✓ Signature deleted' });
      await loadSignatures();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete signature' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Signatures" />
        <div className="flex items-center justify-center h-96">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Manage Signatures" />

      <div className="max-w-5xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <motion.div
              key={role.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">{role.label}</h3>

              {signatures[role.key] ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Name: <span className="font-semibold">{signatures[role.key].name}</span>
                  </p>
                  {signatures[role.key].signature && (
                    <img
                      src={`http://localhost:5000/${signatures[role.key].signature}`}
                      alt="Signature"
                      className="h-16 mb-4 border border-gray-300 rounded"
                    />
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditing(role.key);
                        setFormData({
                          role: role.key,
                          name: signatures[role.key].name,
                          signature: null,
                        });
                      }}
                      className="btn-outline flex-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(role.key)}
                      className="btn-secondary text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditing(role.key);
                    setFormData({ role: role.key, name: '', signature: null });
                  }}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Icons.Plus size={20} />
                  <span>Add {role.label}</span>
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">
                {signatures[editing] ? 'Edit' : 'Add'}{' '}
                {roles.find((r) => r.key === editing)?.label}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Signature Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({ ...formData, signature: e.target.files[0] })
                    }
                    className="input-field"
                  />
                </div>

                <div className="flex space-x-2">
                  <button type="submit" className="btn-primary flex-1">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signatures;