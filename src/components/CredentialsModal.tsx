import React, { useState } from 'react';

interface CredentialsModalProps {
  isOpen: boolean;
  onConfirm: (email: string) => void;
  onCancel: () => void;
  currentEmail?: string;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  currentEmail = ''
}) => {
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState('');

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleConfirm = () => {
    setError('');

    if (!email.trim()) {
      setError('Por favor, informe o email');
      return;
    }
    if (!validateEmail(email)) {
      setError('Email inválido');
      return;
    }
    
    onConfirm(email);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🔐</span> Verificar Email
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Confirme seu email para transmitir
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="seu.email@dominio.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {currentEmail && (
              <p className="text-xs text-gray-500 mt-2">
                Email atual: {currentEmail}
              </p>
            )}
          </div>

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
              <strong>💡 Dica:</strong> Seu email será verificado com Audesp. Se receber erro 401, seu email pode não ter permissão para transmitir.
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
