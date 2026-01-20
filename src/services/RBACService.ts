/**
 * RBACService - Role-Based Access Control para AUDESP
 */

export type Role = 'admin' | 'auditor' | 'manager' | 'viewer' | 'operator';
export type Permission =
  | 'form.create'
  | 'form.read'
  | 'form.update'
  | 'form.delete'
  | 'form.submit'
  | 'document.upload'
  | 'document.review'
  | 'document.delete'
  | 'report.generate'
  | 'report.download'
  | 'transmission.send'
  | 'transmission.view'
  | 'user.manage'
  | 'settings.update';

export interface User {
  id: string;
  cnpj: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface RolePermissionMap {
  [key in Role]: Permission[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  details: Record<string, any>;
  success: boolean;
}

export class RBACService {
  private static instance: RBACService;
  private rolePermissions: RolePermissionMap = {
    admin: [
      'form.create',
      'form.read',
      'form.update',
      'form.delete',
      'form.submit',
      'document.upload',
      'document.review',
      'document.delete',
      'report.generate',
      'report.download',
      'transmission.send',
      'transmission.view',
      'user.manage',
      'settings.update',
    ],
    auditor: [
      'form.read',
      'form.update',
      'document.review',
      'document.delete',
      'report.generate',
      'report.download',
      'transmission.view',
    ],
    manager: [
      'form.create',
      'form.read',
      'form.update',
      'form.delete',
      'form.submit',
      'document.upload',
      'document.review',
      'report.generate',
      'report.download',
      'transmission.send',
      'transmission.view',
    ],
    operator: [
      'form.create',
      'form.read',
      'form.update',
      'document.upload',
      'document.review',
      'report.generate',
      'report.download',
    ],
    viewer: ['form.read', 'report.download', 'transmission.view'],
  };

  private users: Map<string, User> = new Map();
  private auditLogs: AuditLog[] = [];
  private currentUser: User | null = null;

  private constructor() {}

  static getInstance(): RBACService {
    if (!this.instance) {
      this.instance = new RBACService();
    }
    return this.instance;
  }

  /**
   * Criar usuário
   */
  createUser(
    id: string,
    cnpj: string,
    email: string,
    name: string,
    role: Role
  ): User {
    const user: User = {
      id,
      cnpj,
      email,
      name,
      role,
      permissions: this.rolePermissions[role],
      isActive: true,
      createdAt: new Date(),
    };

    this.users.set(id, user);
    this.logAudit(id, 'user.create', 'User', { userId: id, role }, true);

    return user;
  }

  /**
   * Autenticar usuário
   */
  authenticate(userId: string): boolean {
    const user = this.users.get(userId);

    if (!user || !user.isActive) {
      this.logAudit(userId, 'auth.fail', 'User', { reason: 'User not found or inactive' }, false);
      return false;
    }

    this.currentUser = user;
    user.lastLogin = new Date();
    this.logAudit(userId, 'auth.success', 'User', {}, true);

    return true;
  }

  /**
   * Desautenticar usuário
   */
  logout(): void {
    if (this.currentUser) {
      this.logAudit(this.currentUser.id, 'auth.logout', 'User', {}, true);
      this.currentUser = null;
    }
  }

  /**
   * Verificar permissão
   */
  hasPermission(permission: Permission, userId?: string): boolean {
    const user = userId ? this.users.get(userId) : this.currentUser;

    if (!user || !user.isActive) {
      return false;
    }

    return user.permissions.includes(permission);
  }

  /**
   * Verificar múltiplas permissões (AND)
   */
  hasAllPermissions(permissions: Permission[], userId?: string): boolean {
    return permissions.every((p) => this.hasPermission(p, userId));
  }

  /**
   * Verificar múltiplas permissões (OR)
   */
  hasAnyPermission(permissions: Permission[], userId?: string): boolean {
    return permissions.some((p) => this.hasPermission(p, userId));
  }

  /**
   * Atualizar papel do usuário
   */
  updateUserRole(userId: string, newRole: Role): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const oldRole = user.role;
    user.role = newRole;
    user.permissions = this.rolePermissions[newRole];

    this.logAudit(userId, 'user.role.update', 'User', { oldRole, newRole }, true);
    return true;
  }

  /**
   * Conceder permissão adicional
   */
  grantPermission(userId: string, permission: Permission): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    if (!user.permissions.includes(permission)) {
      user.permissions.push(permission);
      this.logAudit(userId, 'permission.grant', 'Permission', { permission }, true);
    }

    return true;
  }

  /**
   * Revogar permissão
   */
  revokePermission(userId: string, permission: Permission): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const index = user.permissions.indexOf(permission);
    if (index > -1) {
      user.permissions.splice(index, 1);
      this.logAudit(userId, 'permission.revoke', 'Permission', { permission }, true);
    }

    return true;
  }

  /**
   * Desativar usuário
   */
  deactivateUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.isActive = false;
    this.logAudit(userId, 'user.deactivate', 'User', {}, true);
    return true;
  }

  /**
   * Ativar usuário
   */
  activateUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.isActive = true;
    this.logAudit(userId, 'user.activate', 'User', {}, true);
    return true;
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obter informações do usuário
   */
  getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  /**
   * Listar usuários
   */
  listUsers(filterRole?: Role): User[] {
    const users = Array.from(this.users.values());
    return filterRole ? users.filter((u) => u.role === filterRole) : users;
  }

  /**
   * Registrar ação em auditoria
   */
  private logAudit(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    success: boolean
  ): void {
    const auditLog: AuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resource,
      timestamp: new Date(),
      details,
      success,
    };

    this.auditLogs.push(auditLog);

    // Manter apenas últimos 10000 logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  /**
   * Obter log de auditoria
   */
  getAuditLog(userId?: string, action?: string, limit: number = 100): AuditLog[] {
    let logs = this.auditLogs;

    if (userId) {
      logs = logs.filter((l) => l.userId === userId);
    }

    if (action) {
      logs = logs.filter((l) => l.action === action);
    }

    return logs.slice(-limit);
  }

  /**
   * Gerar relatório de auditoria
   */
  generateAuditReport(userId?: string): string {
    const logs = userId ? this.getAuditLog(userId) : this.auditLogs.slice(-100);

    let report = '📋 RELATÓRIO DE AUDITORIA\n';
    report += '='.repeat(60) + '\n\n';

    if (userId) {
      const user = this.users.get(userId);
      report += `Usuário: ${user?.name} (${userId})\n`;
      report += `Email: ${user?.email}\n`;
      report += `Papel: ${user?.role}\n\n`;
    }

    report += `Total de ações: ${logs.length}\n`;
    report += `Período: ${logs[0]?.timestamp.toISOString()} a ${logs[logs.length - 1]?.timestamp.toISOString()}\n\n`;

    report += 'AÇÕES:\n';
    report += '-'.repeat(60) + '\n';

    logs.forEach((log) => {
      const status = log.success ? '✅' : '❌';
      report += `${status} [${log.timestamp.toISOString()}] ${log.action}\n`;
      report += `   Usuário: ${log.userId}\n`;
      report += `   Recurso: ${log.resource}\n`;
      if (Object.keys(log.details).length > 0) {
        report += `   Detalhes: ${JSON.stringify(log.details)}\n`;
      }
    });

    return report;
  }

  /**
   * Exportar logs para JSON
   */
  exportAuditLogs(): Array<AuditLog> {
    return [...this.auditLogs];
  }

  /**
   * Verificar atividades suspeitas
   */
  detectSuspiciousActivity(): Array<{
    userId: string;
    activity: string;
    count: number;
    timeWindow: string;
  }> {
    const suspicious = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Verificar múltiplas falhas de autenticação
    const failedAuths = this.auditLogs.filter(
      (log) => log.action === 'auth.fail' && log.timestamp > oneHourAgo
    );

    const failedByUser = new Map<string, number>();
    failedAuths.forEach((log) => {
      failedByUser.set(log.userId, (failedByUser.get(log.userId) || 0) + 1);
    });

    failedByUser.forEach((count, userId) => {
      if (count > 5) {
        suspicious.push({
          userId,
          activity: 'Multiple failed authentication attempts',
          count,
          timeWindow: '1 hour',
        });
      }
    });

    // Verificar revoção de permissões
    const revokedPerms = this.auditLogs.filter(
      (log) => log.action === 'permission.revoke' && log.timestamp > oneHourAgo
    );

    if (revokedPerms.length > 10) {
      suspicious.push({
        userId: 'SYSTEM',
        activity: 'High rate of permission revocations',
        count: revokedPerms.length,
        timeWindow: '1 hour',
      });
    }

    return suspicious;
  }

  /**
   * Resetar sistema (dev only)
   */
  reset(): void {
    this.users.clear();
    this.auditLogs = [];
    this.currentUser = null;
  }
}

export default RBACService.getInstance();
