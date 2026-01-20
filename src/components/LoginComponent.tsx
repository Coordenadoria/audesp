import React, { useState } from 'react';
import { LogIn, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginCredentials {
  cpf: string;
  password: string;
  environment: 'piloto' | 'producao';
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: { cpf: string; name: string; environment: string } | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
}

const mockUsers = {
  '00000000000': { password: 'demo123', name: 'Usuário Demo' },
  '12345678901': { password: 'teste123', name: 'Testador AUDESP' },
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

const LoginComponent: React.FC<{ onSuccess: (user: any) => void }> = ({ onSuccess }) => {
  const [cpf, setCpf] = useState('');
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
      if (!cpf.trim() || !password.trim()) {
        setError('CPF e senha são obrigatórios');
        setLoading(false);
        return;
      }

      // Validar comprimento do CPF
      if (cpf.length !== 11) {
        setError('CPF deve ter exatamente 11 dígitos');
        setLoading(false);
        return;
      }

      // Simular validação
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = mockUsers[cpf as keyof typeof mockUsers];
      
      if (!user) {
        setError('CPF não encontrado. Use um CPF válido da lista de teste.');
        setLoading(false);
        return;
      }

      if (user.password !== password) {
        setError('Senha incorreta para este CPF');
        setLoading(false);
        return;
      }

      onSuccess({
        cpf,
        name: user.name,
        environment,
        loginTime: new Date().toISOString(),
        role: 'operator'
      });
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
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
            <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="00000000000"
              maxLength={11}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {cpf.length}/11 dígitos | Ex: 00000000000
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Demo: demo123</p>
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
          <p className="text-xs text-gray-700 font-semibold mb-3">✅ Credenciais de Teste Válidas:</p>
          <div className="space-y-2">
            <div className="bg-white p-2 rounded border border-blue-100 cursor-pointer hover:bg-blue-50" onClick={() => { setCpf('00000000000'); setPassword('demo123'); }}>
              <p className="text-xs font-mono font-bold text-gray-900">CPF: 00000000000</p>
              <p className="text-xs font-mono text-gray-600">Senha: demo123</p>
              <p className="text-xs text-blue-600">👉 Clique para preencher</p>
            </div>
            <div className="bg-white p-2 rounded border border-blue-100 cursor-pointer hover:bg-blue-50" onClick={() => { setCpf('12345678901'); setPassword('teste123'); }}>
              <p className="text-xs font-mono font-bold text-gray-900">CPF: 12345678901</p>
              <p className="text-xs font-mono text-gray-600">Senha: teste123</p>
              <p className="text-xs text-blue-600">👉 Clique para preencher</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
