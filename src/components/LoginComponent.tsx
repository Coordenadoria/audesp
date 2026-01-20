import React, { useState } from 'react';
import { LogIn, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import LoginService from '../services/LoginService';

interface LoginCredentials {
  email: string;
  password: string;
  environment: 'piloto' | 'producao';
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: { email: string; name: string; environment: string } | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);

const LoginComponent: React.FC<{ onSuccess: (user: any) => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [environment, setEnvironment] = useState<'piloto' | 'producao'>('piloto');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar campos vazios
      if (!email.trim() || !password.trim()) {
        setError('Email e senha são obrigatórios');
        setLoading(false);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Formato de email inválido');
        setLoading(false);
        return;
      }

      // Conectar com API AUDESP real
      const response = await LoginService.login(email, password);
      
      if (!response.success) {
        setError(response.message || 'Erro ao fazer login');
        setLoading(false);
        return;
      }

      // Sucesso - guardar dados do usuário
      const userData = {
        email,
        name: response.usuario?.nome || email.split('@')[0],
        environment,
        token: response.token,
        loginTime: new Date().toISOString(),
        role: 'operator'
      };

      // Guardar no localStorage
      localStorage.setItem('audesp_token', response.token || '');
      localStorage.setItem('audesp_email', email);
      localStorage.setItem('audesp_user', JSON.stringify(userData));

      onSuccess(userData);
    } catch (err) {
      setError('Erro ao fazer login. Verifique sua conexão.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-100 rounded-lg mb-4">
            <Lock size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AUDESP v1.9</h1>
          <p className="text-sm text-gray-600 mt-1">Prestação de Contas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email (seu-email@orgao.sp.gov.br)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@seu-orgao.sp.gov.br"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              autoComplete="email"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cadastrado no TCE-SP
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ambiente</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as 'piloto' | 'producao')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="piloto">Piloto (Teste)</option>
              <option value="producao">Produção</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-gray-700 font-semibold mb-2">ℹ️ Informações:</p>
          <p className="text-xs text-gray-600">
            Use as credenciais fornecidas pelo TCE-SP para seu órgão.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            📞 Dúvidas: (11) 3886-6000<br/>
            📧 Email: suporte-audesp@tce.sp.gov.br
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
