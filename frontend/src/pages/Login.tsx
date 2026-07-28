import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send loginId instead of email to match your backend
      const response = await api.post('/auth/login', { loginId, password });
      
      // Save token and role returned from your backend
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role);

      // Route based on role
      const role = response.data.role;
      if (role === 'STUDENT') navigate('/student');
      else if (role === 'TEACHER' || role === 'ADMIN') navigate('/teacher');
      else if (role === 'PARENT') navigate('/parent');
    } catch (err) {
      alert('Login failed. Check your credentials.');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto' }}>
      <h2>School Portal Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Login ID" 
          value={loginId} 
          onChange={(e) => setLoginId(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}