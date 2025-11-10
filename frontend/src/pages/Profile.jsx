import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../utils/api';
import Header from '../components/Header';
import { Icons } from '../assets/icons';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await studentAPI.getProfile();
      setProfile(data);
      setFormData({
        full_name: data.full_name,
        email: data.email || '',
        phone: data.phone || '',
        photo: null,
      });
      if (data.photo) {
        setPhotoPreview(`http://localhost:5000/${data.photo}`);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage({ type: '', text: '' });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Photo size must be less than 2MB' });
        return;
      }

      setFormData({ ...formData, photo: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const submitData = new FormData();
      submitData.append('full_name', formData.full_name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      if (formData.photo) {
        submitData.append('photo', formData.photo);
      }

      const result = await studentAPI.updateProfile(submitData);
      
      if (result.requires_approval) {
        setMessage({
          type: 'warning',
          text: '⚠️ Name change requires admin approval. Other changes saved successfully.',
        });
      } else {
        setMessage({
          type: 'success',
          text: '✓ Profile updated successfully!',
        });
      }

      await loadProfile();
      setEditing(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="My Profile" />
        <div className="flex items-center justify-center h-96">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="My Profile" />

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

        <div className="card">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-outline flex items-center space-x-2"
              >
                <Icons.Edit size={20} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div className="flex items-center space-x-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icons.User size={48} color="#999" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="btn-outline cursor-pointer inline-block mb-2"
                  >
                    Change Photo
                  </label>
                  <p className="text-xs text-gray-500">
                    Max size: 2MB • JPG, PNG
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Name changes require admin approval
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="08012345678"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="loader w-5 h-5 border-2"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Check size={20} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      full_name: profile.full_name,
                      email: profile.email || '',
                      phone: profile.phone || '',
                      photo: null,
                    });
                    if (profile.photo) {
                      setPhotoPreview(`http://localhost:5000/${profile.photo}`);
                    }
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Photo & Basic Info */}
              <div className="flex items-center space-x-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-primary">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icons.User size={48} color="#999" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    {profile.full_name}
                  </h3>
                  <p className="text-gray-600 mb-2">{profile.matric_number}</p>
                  <div className="flex space-x-2">
                    <span className="badge-success">
                      {profile.department}
                    </span>
                    <span className="badge-pending">
                      Level {profile.level}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-800">
                        {profile.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-800">
                        {profile.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">Academic Status</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Registration Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        profile.registration_status?.first_semester === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile.registration_status?.first_semester === 'approved'
                          ? 'Approved'
                          : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-medium text-gray-800">
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Name Change Notice */}
              {profile.profile_edit_pending && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <div className="flex items-start space-x-3">
                    <Icons.Warning size={20} color="#FF9800" />
                    <div>
                      <p className="font-semibold text-gray-800">Pending Name Change</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your name change request to "{profile.pending_name_change}" is awaiting admin approval.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;