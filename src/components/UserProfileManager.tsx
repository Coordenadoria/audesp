import React, { useState } from 'react';
import { X, Shield, Eye, Edit2, Lock, Trash2, Plus, Check } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  cpf: string;
  role: 'operador' | 'gestor' | 'auditor' | 'admin' | 'contador';
  email: string;
  department: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  createdAt: string;
  lastLogin: string;
  permissions: string[];
}

const ROLE_PERMISSIONS = {
  operador: ['ver_formulario', 'editar_formulario', 'enviar_dados', 'ver_relatorios'],
  gestor: ['ver_formulario', 'editar_formulario', 'enviar_dados', 'ver_relatorios', 'gerenciar_usuarios_basico', 'auditoria_basica'],
  auditor: ['ver_formulario', 'ver_relatorios', 'auditoria_completa', 'exportar_dados', 'ver_historico_completo'],
  admin: ['todos'],
  contador: ['ver_formulario', 'editar_formulario', 'ver_relatorios_financeiros', 'exportar_dados_financeiros', 'assinatura_digital']
};

const UserProfileManager: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: any }> = ({ 
  isOpen, 
  onClose, 
  currentUser 
}) => {
  const [users, setUsers] = useState<UserProfile[]>([
    {
      id: '1',
      name: 'Usuário Demo',
      cpf: '00000000000',
      role: 'operador',
      email: 'demo@audesp.gov.br',
      department: 'Operacional',
      status: 'ativo',
      createdAt: '2024-01-01',
      lastLogin: new Date().toISOString(),
      permissions: ROLE_PERMISSIONS.operador
    }
  ]);

  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', cpf: '', email: '', role: 'operador' as const });

  const handleAddUser = () => {
    if (newUser.name && newUser.cpf && newUser.email) {
      const user: UserProfile = {
        id: Date.now().toString(),
        name: newUser.name,
        cpf: newUser.cpf,
        role: newUser.role,
        email: newUser.email,
        department: 'Novo',
        status: 'ativo',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: ROLE_PERMISSIONS[newUser.role]
      };
      setUsers([...users, user]);
      setNewUser({ name: '', cpf: '', email: '', role: 'operador' });
      setShowNewUserForm(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (id !== currentUser.cpf.replace(/\D/g, '')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'gestor':
        return 'bg-blue-100 text-blue-800';
      case 'auditor':
        return 'bg-purple-100 text-purple-800';
      case 'contador':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-gray-100 text-gray-800';
      case 'suspenso':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={28} />
            <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Add User Form */}
          {showNewUserForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Novo Usuário</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="CPF (sem máscara)"
                  value={newUser.cpf}
                  onChange={(e) => setNewUser({ ...newUser, cpf: e.target.value.replace(/\D/g, '') })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  maxLength={11}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="operador">Operador</option>
                  <option value="gestor">Gestor</option>
                  <option value="auditor">Auditor</option>
                  <option value="contador">Contador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddUser}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Check size={18} /> Adicionar
                </button>
                <button
                  onClick={() => setShowNewUserForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Add User Button */}
          {!showNewUserForm && (
            <button
              onClick={() => setShowNewUserForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus size={18} /> Novo Usuário
            </button>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">CPF</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Perfil</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Último Acesso</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{user.cpf}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Visualizar">
                        <Eye size={16} />
                      </button>
                      <button className="p-1 text-green-600 hover:bg-green-100 rounded" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1 text-orange-600 hover:bg-orange-100 rounded" title="Resetar senha">
                        <Lock size={16} />
                      </button>
                      {user.cpf !== currentUser.cpf && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Deletar"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Permissions Reference */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Referência de Permissões por Perfil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                <div key={role} className="border border-gray-200 rounded p-3">
                  <p className="font-semibold text-gray-900 capitalize mb-2">{role}</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {Array.isArray(perms) ? (
                      perms.slice(0, 5).map((perm) => (
                        <li key={perm}>✓ {perm.replace(/_/g, ' ')}</li>
                      ))
                    ) : (
                      <li>✓ Todas as permissões</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileManager;
