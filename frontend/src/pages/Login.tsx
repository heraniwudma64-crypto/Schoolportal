import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios'; // Make sure to use 'api' instead of 'axios'

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use 'api' instance here instead of 'axios'
      const response = await api.post('/auth/login', {
        loginId: loginId,
        password: password,
      });
      
      // Redirect based on role returned from backend
      const role = response.data.role;
      if (role === 'STUDENT') navigate('/student');
      else if (role === 'TEACHER') navigate('/teacher');
      else if (role === 'ADMIN') navigate('/admin');
      else navigate('/parent');

    } catch (error) {
      console.error(error);
      alert('Login failed: Invalid ID or password');
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
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#4f46e5', textDecoration: 'underline' }}>
              Register now
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}