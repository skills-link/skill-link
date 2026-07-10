import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardFor } from '../utils/roleRoutes';
import AlertMessage from '../components/AlertMessage';
import logo from '../assets/skill-link-logo.jpeg';
import loginBackground from '../../images/Gemini_Generated_Image_wzqs1ywzqs1ywzqs.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      // AuthContext stores the token/user and returns the logged-in user.
      const user = await login(form.email, form.password);
      // If the user was redirected here from a protected page, send them back there.
      navigate(location.state?.from?.pathname || dashboardFor(user.role));
    } catch (err) {
      console.error('Login error', err);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="auth-page"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(227, 247, 240, 0.35) 0%, rgba(212, 240, 247, 0.35) 100%), url(${loginBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="auth-card">
        <img src={logo} alt="Skill Link Uganda" className="login-logo" />
        <h1 className="h3 mb-3 text-center">Login</h1>
        <AlertMessage message={error} />
        <label className="form-label">Email</label>
        <input
          className="form-control mb-3"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <label className="form-label">Password</label>
        <input
          className="form-control mb-3"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" className="btn btn-primary w-100" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
        <p className="text-secondary small mt-3 mb-0 text-center">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
