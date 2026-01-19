import React, { useState } from 'react';

interface CredentialsModalProps {
  isOpen: boolean;
  onConfirm: (cpf: string, email: string) => void;
  onCancel: () => void;
  currentCpf?: string;
  currentEmail?: string;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  currentCpf = '',
  currentEmail = ''
}) => {
  const [cpf, setCpf] = useState(currentCpf);
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'cpf' | 'email'>('cpf');

  const validateCPF = (value: string): boolean => {
    // Remove non-digits
    const clean = value.replace(/\D/g, '');
    return clean.length === 11;
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleConfirm = () => {
    setError('');

    if (selectedTab === 'cpf') {
      if (!cpf.trim()) {
        setError('Por favor, informe o CPF');
        return;
      }
      if (!validateCPF(cpf)) {
        setError('CPF inválido (deve conter 11 dígitos)');
        return;
      }
      onConfirm(cpf.replace(/\D/g, ''), email);
    } else {
      if (!email.trim()) {
        setError('Por favor, informe o email');
        return;
      }
      if (!validateEmail(email)) {
        setError('Email inválido');
        return;
      }
      onConfirm(cpf, email);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🔐</span> Verificar Credenciais
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Confirme sua identidade para transmitir
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => {
              setSelectedTab('cpf');
              setError('');
            }}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              selectedTab === 'cpf'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            CPF
          </button>
          <button
            onClick={() => {
              setSelectedTab('email');
              setError('');
            }}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              selectedTab === 'email'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Email
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {selectedTab === 'cpf' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => {
                  setCpf(e.target.value);
                  setError('');
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {currentCpf && (
                <p className="text-xs text-gray-500 mt-2">
                  CPF atual: {currentCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="seu.email@exemplo.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {currentEmail && (
                <p className="text-xs text-gray-500 mt-2">
                  Email atual: {currentEmail}
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <span className="text-red-600 mt-0.5">⚠️</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900 text-xs">
              <strong>💡 Dica:</strong> Suas credenciais serão verificadas com Audesp. Se receber erro 401, pode ser que seu CPF/email não tenha permissão para transmitir.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg border-t">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredentialsModal;
