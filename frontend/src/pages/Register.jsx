import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardFor } from '../utils/roleRoutes';
import AlertMessage from '../components/AlertMessage';
import logo from '../assets/skill-link-logo.jpeg';
import registerBackground from '../../images/Gemini_Generated_Image_wzqs1ywzqs1ywzqs.png';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'job_seeker' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(dashboardFor(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="auth-page register-page"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(227, 247, 240, 0.35) 0%, rgba(212, 240, 247, 0.35) 100%), url(${registerBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <form className="auth-card register-card" onSubmit={handleSubmit}>
        <div className="register-brand text-center mb-4">
          <img src={logo} alt="Skill Link Uganda" className="register-logo mb-3" />
        </div>

        <AlertMessage message={error} />

        <label className="form-label">Full name</label>
        <input
          className="form-control register-input mb-3"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label className="form-label">Work email</label>
        <input
          className="form-control register-input mb-3"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <label className="form-label">Password</label>
        <div className="password-field mb-3">
          <input
            className="form-control register-input"
            type={showPassword ? 'text' : 'password'}
            minLength="6"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        <label className="form-label">Account type</label>
        <div className="account-toggle mb-4" role="group" aria-label="Account type selector">
          <button
            type="button"
            className={`pill-button ${form.role === 'job_seeker' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'job_seeker' })}
          >
            Job Seeker
          </button>
          <button
            type="button"
            className={`pill-button ${form.role === 'employer' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'employer' })}
          >
            Employer
          </button>
        </div>

        <button className="btn btn-primary register-submit w-100 mb-3" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign In'}
        </button>

        <p className="register-footer-text">
          Already have an account? <Link className="register-login-link" to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
};

export default Register;
