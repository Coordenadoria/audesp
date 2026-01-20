import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import LoginService, { LoginResponse } from '../services/LoginService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, token: string, perfil: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resposta, setResposta] = useState<LoginResponse | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setResposta(null);

    const resultado = await LoginService.login(email, senha);
    setResposta(resultado);

    if (resultado.success && resultado.token && resultado.usuario) {
      // Armazenar no localStorage
      localStorage.setItem('audesp_token', resultado.token);
      localStorage.setItem('audesp_email', resultado.usuario.email);
      localStorage.setItem('audesp_perfil', resultado.usuario.perfil);
      localStorage.setItem('audesp_nome', resultado.usuario.nome);

      // Callback de sucesso
      onLoginSuccess(resultado.usuario.email, resultado.token, resultado.usuario.perfil);

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
        setEmail('');
        setSenha('');
        setResposta(null);
      }, 2000);
    }

    setCarregando(false);
  };

  const handleFeclar = () => {
    setEmail('');
    setSenha('');
    setResposta(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Login AUDESP</h2>
            <p className="text-blue-100 text-sm">Sistema de Prestação de Contas v3.0</p>
          </div>
          <button
            onClick={handleFeclar}
            className="text-white hover:bg-blue-800 p-1 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Status Message */}
          {resposta && (
            <div
              className={`p-4 rounded-lg flex gap-3 ${
                resposta.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {resposta.success ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              )}
              <div>
                <p
                  className={`text-sm font-semibold mb-1 ${
                    resposta.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {resposta.success ? '✅ Login bem-sucedido!' : '❌ Erro no login'}
                </p>
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    resposta.success ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {resposta.message}
                </p>
              </div>
            </div>
          )}

          {/* Aviso API Real */}
          {(
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                🔒 Autenticação com API AUDESP
              </p>
              <p className="text-xs text-blue-700">
                Use suas credenciais reais fornecidas pelo TCE-SP para acessar o sistema.
              </p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={carregando || (resposta?.success === true)}
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={carregando || (resposta?.success === true)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {/* Botão Login */}
            <button
              type="submit"
              disabled={carregando || (resposta?.success === true)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Dica de Usuários Demo */}
          {!resposta?.success && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs">
              <p className="font-semibold text-gray-900 mb-2">📝 Instruções:</p>
              <p className="text-gray-700 mb-2">
                Use as credenciais fornecidas pelo TCE-SP para acessar o sistema.
              </p>
              <p className="text-gray-600">
                Contato TCE-SP: <strong>(11) 3293-3000</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
