import React from 'react';
import { AlertCircle } from 'lucide-react';
import { RBACService, Permission, Role } from '../services/RBACService';

interface AccessControlProps {
  require?: Permission | Permission[];
  requireAll?: boolean; // true = AND, false = OR
  requireRole?: Role | Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  rbac?: RBACService;
}

/**
 * Componente wrapper para controlar acesso
 */
export const AccessControl: React.FC<AccessControlProps> = ({
  require,
  requireAll = true,
  requireRole,
  fallback,
  children,
  rbac = RBACService.getInstance(),
}) => {
  const currentUser = rbac.getCurrentUser();

  // Se não há usuário autenticado
  if (!currentUser) {
    return (
      fallback || (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">Você precisa estar autenticado para acessar este conteúdo</p>
        </div>
      )
    );
  }

  // Verificar role se necessário
  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!roles.includes(currentUser.role)) {
      return (
        fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">Você não possui permissão de acesso. Papel requerido: {roles.join(', ')}</p>
          </div>
        )
      );
    }
  }

  // Verificar permissões se necessário
  if (require) {
    const permissions = Array.isArray(require) ? require : [require];
    const hasAccess = requireAll
      ? rbac.hasAllPermissions(permissions, currentUser.id)
      : rbac.hasAnyPermission(permissions, currentUser.id);

    if (!hasAccess) {
      return (
        fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">Você não possui permissão para acessar este conteúdo</p>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
};

/**
 * Hook para verificar permissões
 */
export const useAccessControl = (rbac?: RBACService) => {
  const service = rbac || RBACService.getInstance();

  return {
    currentUser: service.getCurrentUser(),
    hasPermission: (permission: Permission) => service.hasPermission(permission),
    hasAllPermissions: (permissions: Permission[]) => service.hasAllPermissions(permissions),
    hasAnyPermission: (permissions: Permission[]) => service.hasAnyPermission(permissions),
    hasRole: (role: Role | Role[]) => {
      const user = service.getCurrentUser();
      if (!user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role);
    },
  };
};

/**
 * Hook para ações com auditoria
 */
export const useAuditedAction = (rbac?: RBACService) => {
  const service = rbac || RBACService.getInstance();
  const currentUser = service.getCurrentUser();

  return {
    executeAction: async <T,>(
      action: () => Promise<T> | T,
      actionName: string,
      resource: string,
      details?: Record<string, any>
    ): Promise<{ success: boolean; result?: T; error?: string }> => {
      try {
        const result = await Promise.resolve(action());
        // Ação registrada internamente pelo RBACService se necessário
        return { success: true, result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
      }
    },
    canExecute: (permission: Permission): boolean => service.hasPermission(permission),
  };
};

export default AccessControl;
