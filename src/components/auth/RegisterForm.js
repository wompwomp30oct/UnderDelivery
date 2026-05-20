'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    registrationNumber: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (!formData.email.endsWith('@vitbhopal.ac.in')) {
      addToast('Only @vitbhopal.ac.in emails are allowed', 'error');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        registrationNumber: formData.registrationNumber.toUpperCase(),
        phone: formData.phone,
      });
      addToast('Registration successful!', 'success');
      router.push('/select-role');
    } catch (error) {
      addToast(error.message || 'Failed to register', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container py-8">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join UnderDelivery with your VIT Bhopal details</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              className="form-input"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Registration No.</label>
              <input
                type="text"
                name="registrationNumber"
                className="form-input"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="21BCEXXXX"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">College Email ID</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. name.year@vitbhopal.ac.in"
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="btn btn-primary btn-full mt-4"
            isLoading={loading}
          >
            Register
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link href="/">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
