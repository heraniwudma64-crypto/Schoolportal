import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaCamera, FaTrash } from 'react-icons/fa';
import api from '../api/axios';

export default function TeacherSettings() {
  const [formData, setFormData] = useState({
    loginId: '',
    email: '',
    name: '',
    profilePic: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch current user details on load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get('/auth/profile'); // Endpoint returning user details
        setFormData({
          loginId: res.data.loginId || '',
          email: res.data.email || '',
          name: res.data.name || '',
          profilePic: res.data.profilePic || '',
        });
      } catch (err) {
        console.error('Failed to load profile details');
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle uploading/converting image to Base64 (or handle via FormData file upload)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePic: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.put('/auth/profile', formData); // Backend route to update info
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <h2 style={{ marginBottom: '20px', color: '#0f172a' }}>Account Settings</h2>
      
      {message && (
        <div style={{ padding: '10px 15px', marginBottom: '20px', background: message.includes('success') ? '#dcfce7' : '#fee2e2', color: message.includes('success') ? '#166534' : '#991b1b', borderRadius: '6px' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile Picture Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            {formData.profilePic ? (
              <img 
                src={formData.profilePic} 
                alt="Profile Preview" 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} 
              />
            ) : (
              <FaUserCircle style={{ fontSize: '80px', color: '#cbd5e1' }} />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ background: '#2563eb', color: '#fff', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
              <FaCamera /> Upload New Photo
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
            {formData.profilePic && (
              <button 
                type="button" 
                onClick={handleRemovePhoto} 
                style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}
              >
                <FaTrash /> Remove Photo
              </button>
            )}
          </div>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>Full Name</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>Login ID / Admission Number</label>
          <input 
            type="text" 
            name="loginId" 
            value={formData.loginId} 
            onChange={handleChange} 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>Email Address</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ background: '#0f172a', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
        >
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}