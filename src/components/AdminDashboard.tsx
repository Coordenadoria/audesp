import React, { useState, useCallback } from 'react';
import {
  Users,
  Lock,
  LogOut,
  Settings,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Edit2,
} from 'lucide-react';
import { RBACService, User, Role, Permission } from '../services/RBACService';
import AccessControl from './AccessControl';

interface AdminDashboardProps {
  rbac: RBACService;
  onLogout?: () => void;
}

type Tab = 'users' | 'permissions' | 'audit' | 'security';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ rbac, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    id: '',
    cnpj: '',
    email: '',
    name: '',
    role: 'viewer' as Role,
  });

  const currentUser = rbac.getCurrentUser();
  const allUsers = rbac.listUsers();

  const handleCreateUser = () => {
    if (newUserData.id && newUserData.email && newUserData.cnpj) {
      rbac.createUser(
        newUserData.id,
        newUserData.cnpj,
        newUserData.email,
        newUserData.name,
        newUserData.role
      );

      setNewUserData({ id: '', cnpj: '', email: '', name: '', role: 'viewer' });
      setShowNewUserForm(false);
    }
  };

  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    rbac.updateUserRole(userId, newRole);
    setSelectedUser(null);
  };

  const handleDeactivateUser = (userId: string) => {
    rbac.deactivateUser(userId);
    setSelectedUser(null);
  };

  const handleActivateUser = (userId: string) => {
    rbac.activateUser(userId);
    setSelectedUser(null);
  };

  const suspiciousActivities = rbac.detectSuspiciousActivity();

  return (
    <AccessControl require="user.manage" fallback={<div>Acesso negado</div>}>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔐 Painel Administrativo</h1>
              <p className="text-sm text-gray-600 mt-1">
                Usuário: {currentUser?.name} ({currentUser?.role})
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Alerts */}
        {suspiciousActivities.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">⚠️ Atividades Suspeitas Detectadas</h3>
                <ul className="mt-2 space-y-1">
                  {suspiciousActivities.map((activity, i) => (
                    <li key={i} className="text-sm text-orange-700">
                      • {activity.activity} (Usuário: {activity.userId}, Contador: {activity.count})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['users', 'permissions', 'audit', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'users' && '👥 Usuários'}
              {tab === 'permissions' && '🔑 Permissões'}
              {tab === 'audit' && '📋 Auditoria'}
              {tab === 'security' && '🔒 Segurança'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Usuários</h2>
                <button
                  onClick={() => setShowNewUserForm(!showNewUserForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Usuário
                </button>
              </div>

              {/* New User Form */}
              {showNewUserForm && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="ID"
                    value={newUserData.id}
                    onChange={(e) => setNewUserData({ ...newUserData, id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="CNPJ"
                    value={newUserData.cnpj}
                    onChange={(e) => setNewUserData({ ...newUserData, cnpj: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nome"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <select
                    value={newUserData.role}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, role: e.target.value as Role })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="auditor">Auditor</option>
                    <option value="manager">Manager</option>
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateUser}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => setShowNewUserForm(false)}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-900 rounded text-sm hover:bg-gray-400 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="space-y-2">
                {allUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                      selectedUser?.id === user.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'border-gray-200'
                    } ${!user.isActive ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {user.name}
                          {!user.isActive && (
                            <span className="ml-2 text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                              Inativo
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          CNPJ: {user.cnpj} | Papel: {user.role}
                        </p>
                        {user.lastLogin && (
                          <p className="text-xs text-gray-500">
                            Último acesso: {new Date(user.lastLogin).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                      {selectedUser?.id === user.id && (
                        <div className="space-y-2">
                          {!user.isActive ? (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                            >
                              Ativar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                            >
                              Desativar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && selectedUser && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Permissões - {selectedUser.name}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {selectedUser.permissions.map((permission) => (
                  <div
                    key={permission}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-900 font-mono">{permission}</span>
                    <button
                      onClick={() => rbac.revokePermission(selectedUser.id, permission)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Log de Auditoria</h2>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-900">Timestamp</th>
                      <th className="px-4 py-2 text-left text-gray-900">Usuário</th>
                      <th className="px-4 py-2 text-left text-gray-900">Ação</th>
                      <th className="px-4 py-2 text-left text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rbac.getAuditLog(undefined, undefined, 50).map((log) => (
                      <tr key={log.id} className={!log.success ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2 text-gray-600">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="px-4 py-2 text-gray-900 font-mono">{log.userId}</td>
                        <td className="px-4 py-2 text-gray-900">{log.action}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              log.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.success ? '✅ OK' : '❌ ERRO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <Lock className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Usuários Ativos</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {allUsers.filter((u) => u.isActive).length}/{allUsers.length}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <AlertTriangle className="w-8 h-8 text-orange-600 mb-2" />
                  <h3 className="font-semibold text-gray-900">Atividades Suspeitas</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {suspiciousActivities.length}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Dicas de Segurança</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>✓ Revise regularmente os usuários inativos</li>
                  <li>✓ Monitore atividades suspeitas</li>
                  <li>✓ Rotação de credenciais a cada 90 dias</li>
                  <li>✓ Ative autenticação de dois fatores quando possível</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccessControl>
  );
};

export default AdminDashboard;
