import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css'; // Make sure to style matching your theme

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    email: '',
    gender: '',
    role: 'STUDENT', // STUDENT, TEACHER, ADMIN
    classGrade: '',
    password: '',
    confirmPassword: '',
    // Role-specific fields
    parentName: '',
    parentPhone: '',
    address: '',
    medicalStatus: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      await axios.post('http://localhost:5000/auth/register', formData);
      alert('Registration successful!');
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="logo-icon">🎓</div>
        <h2>Create Account</h2>
        <p className="subtitle">Join the Mentor Academy community</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  placeholder="e.g. STD001 or TCH001"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="input-group">
                <label>Select Role</label>
                <select name="role" value={formData.role} onChange={handleChange} required>
                  <option value="STUDENT">Student / Parent</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {/* Right Column (Conditional based on Role) */}
            <div className="form-column">
              {formData.role === 'STUDENT' ? (
                <>
                  <div className="input-group">
                    <label>Class / Grade</label>
                    <input
                      type="text"
                      name="classGrade"
                      placeholder="e.g. Grade 10A"
                      value={formData.classGrade}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Parent / Guardian Name</label>
                    <input
                      type="text"
                      name="parentName"
                      placeholder="Enter guardian name"
                      value={formData.parentName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Parent / Guardian Number</label>
                    <input
                      type="text"
                      name="parentPhone"
                      placeholder="Enter phone number"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Enter home address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              ) : (
                // TEACHER or ADMIN fields
                <>
                  <div className="input-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="Enter home address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Medical Status / Notes</label>
                    <input
                      type="text"
                      name="medicalStatus"
                      placeholder="Any medical conditions / None"
                      value={formData.medicalStatus}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="********"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

        <button type="submit" className="submit-btn">
            Create Account &rarr;
          </button> {/* <-- Change to </button> */}
        </form>

        <p className="login-redirect">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}