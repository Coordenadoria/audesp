/**
 * LOGIN APRIMORADO - Seleção de Ambiente (Piloto/Produção)
 * Interface moderna com segurança e rastreamento
 */

import React, { useState } from 'react';
import EnhancedAuthService, { Environment } from '../services/enhancedAuthService';

interface LoginProps {
  onLoginSuccess: (token: string, environment: Environment, cpf: string) => void;
  onError: (error: string) => void;
}

const EnhancedLoginComponent: React.FC<LoginProps> = ({
  onLoginSuccess,
  onError
}) => {
  const [environment, setEnvironment] = useState<Environment>('piloto');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleEnvironmentChange = (env: Environment) => {
    setEnvironment(env);
    EnhancedAuthService.setEnvironment(env);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cpf || !password) {
      onError('CPF e senha são obrigatórios');
      return;
    }

    // Validar CPF (11 dígitos)
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      onError('CPF deve ter 11 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      // Usar CPF como identificador de login (conforme manual Audesp)
      const token = await EnhancedAuthService.login({
        email: cpfDigits, // Enviar CPF como email (compatibilidade com API)
        password
      });

      console.log('[Login] ========== RESULTADO DO LOGIN COM CPF ==========');
      console.log('[Login] CPF informado:', cpfDigits);
      console.log('[Login] Senha: ••••••••');
      console.log('[Login] Token obtido com sucesso');
      console.log('[Login] ============================================');

      // Salvar preferência de ambiente
      if (rememberMe) {
        localStorage.setItem('audesp_last_environment', environment);
        localStorage.setItem('audesp_last_cpf', cpfDigits);
      }

      // Passar o CPF como identificador principal
      onLoginSuccess(token.token, environment, cpfDigits);
    } catch (error: any) {
      onError(error.message || 'Erro ao fazer login com CPF');
    } finally {
      setIsLoading(false);
    }
  };

  const baseUrl = EnhancedAuthService.getBaseUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      {/* CONTAINER PRINCIPAL */}
      <div className="w-full max-w-md">
        {/* CARD LOGIN */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
          {/* LOGO E TITULO */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">🏛️</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Audesp Connect
            </h1>
            <p className="text-sm text-slate-500">
              Prestação de Contas v2.0
            </p>
          </div>

          {/* SELEÇÃO DE AMBIENTE */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-3">
              Ambiente
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* PILOTO */}
              <button
                onClick={() => handleEnvironmentChange('piloto')}
                className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                  environment === 'piloto'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="block mb-1">🧪</span>
                <span className="text-xs">Piloto (Teste)</span>
              </button>

              {/* PRODUÇÃO */}
              <button
                onClick={() => handleEnvironmentChange('producao')}
                className={`p-3 rounded-lg border-2 font-bold text-sm transition-all ${
                  environment === 'producao'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="block mb-1">🚀</span>
                <span className="text-xs">Produção</span>
              </button>
            </div>

            {/* AVISO DE PRODUÇÃO */}
            {environment === 'producao' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-bold">
                  ⚠️ Você está conectando ao ambiente de PRODUÇÃO.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Certifique-se de estar enviando dados reais.
                </p>
              </div>
            )}

            {/* INFORMAÇÃO DE AMBIENTE */}
            <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
              <strong>Endpoint:</strong>{' '}
              <span className="font-mono text-[10px]">{baseUrl}</span>
            </div>
          </div>

          {/* FORMULÁRIO */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* CPF - CAMPO PRINCIPAL */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                🔑 CPF (11 dígitos)
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setCpf(digits);
                }}
                placeholder="00000000000"
                className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-slate-700 placeholder:text-slate-400 font-mono text-lg"
                disabled={isLoading}
                required
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">
                Seu CPF com 11 dígitos (usado como identificador)
              </p>
            </div>

            {/* SENHA */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
                🔐 Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-slate-700 placeholder:text-slate-400"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            {/* LEMBRAR-ME */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 border-slate-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                disabled={isLoading}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-slate-600 cursor-pointer"
              >
                Lembrar CPF e ambiente
              </label>
            </div>

            {/* BOTÃO LOGIN */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Autenticando...
                </>
              ) : (
                <>
                  <span>🔐</span>
                  Entrar com CPF
                </>
              )}
            </button>
          </form>

          {/* RODAPÉ */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-2">
              Sistema de Prestação de Contas Eletrônica
            </p>
            <p className="text-xs text-slate-600">
              <strong>Ambiente:</strong>{' '}
              {environment === 'piloto'
                ? '🧪 Teste (Piloto)'
                : '🚀 Produção'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              <strong>Login via CPF</strong> - Conforme Manual Audesp
            </p>
          </div>
        </div>

        {/* INFORMAÇÕES ADICIONAIS */}
        <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-4 text-white text-sm">
          <p className="mb-2">
            <strong>💡 Dica:</strong> Use o ambiente Piloto para testar antes de enviar
            em Produção.
          </p>
          <p className="text-xs opacity-90">
            © 2024 Tribunal de Contas do Estado de São Paulo
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginComponent;
