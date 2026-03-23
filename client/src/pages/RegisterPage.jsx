import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './LoginPage.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      await register({ username, email, password });
      toast.success('Đã tạo tài khoản thành công!');
      navigate('/login');
    } catch (err) {
      if (Array.isArray(err.response?.data)) {
        const msgs = err.response.data.map(d => Object.values(d)[0]).join(', ');
        toast.error(msgs);
      } else {
        toast.error(err.response?.data?.message || 'Đăng ký thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-old">
      <div className="gummy-register-box">
        <div className="gummy-logo">Gummy</div>
        <div className="sub">Tham gia thế giới ngọt ngào nhất ♡</div>

        <form onSubmit={handleSubmit}>
          <input className="g-input single" placeholder="Tên đăng nhập" value={username}
            onChange={(e) => setUsername(e.target.value)} autoFocus />
          <input className="g-input single" placeholder="Email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <input className="g-input single" placeholder="Mật khẩu" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} />

          <button type="submit" className="gummy-btn" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
          </button>

          <div className="g-login-link">
            <Link to="/login">Đã có tài khoản?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
