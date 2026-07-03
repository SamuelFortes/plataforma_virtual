import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/login?error=${error}`, { replace: true });
      return;
    }

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/login?error=dados_invalidos', { replace: true });
      }
    } else {
      navigate('/login?error=login_cancelado', { replace: true });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Autenticando com Google...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
