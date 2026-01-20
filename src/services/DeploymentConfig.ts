/**
 * DeploymentConfig - Configurações de deploy para AUDESP
 */

export interface Environment {
  name: 'development' | 'staging' | 'production';
  apiBaseURL: string;
  wsBaseURL: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  corsOrigins: string[];
  maxUploadSize: number; // em bytes
  sessionTimeout: number; // em minutos
  jwtSecret: string;
}

export interface DeploymentChecklist {
  item: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export class DeploymentConfig {
  private static instance: DeploymentConfig;
  private currentEnvironment: Environment;
  private environments: Map<string, Environment> = new Map();
  private deploymentDate: Date = new Date();

  private constructor() {
    this.currentEnvironment = this.getDefaultDevelopmentEnvironment();
    this.initializeEnvironments();
  }

  static getInstance(): DeploymentConfig {
    if (!this.instance) {
      this.instance = new DeploymentConfig();
    }
    return this.instance;
  }

  /**
   * Obter ambiente padrão de desenvolvimento
   */
  private getDefaultDevelopmentEnvironment(): Environment {
    return {
      name: 'development',
      apiBaseURL: 'http://localhost:3001',
      wsBaseURL: 'ws://localhost:3001',
      logLevel: 'debug',
      enableAnalytics: false,
      enableErrorReporting: false,
      corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
      maxUploadSize: 50 * 1024 * 1024, // 50MB
      sessionTimeout: 60, // 60 minutos
      jwtSecret: 'dev-secret-change-in-production',
    };
  }

  /**
   * Inicializar ambientes
   */
  private initializeEnvironments(): void {
    // Development
    this.environments.set('development', this.getDefaultDevelopmentEnvironment());

    // Staging
    this.environments.set('staging', {
      name: 'staging',
      apiBaseURL: 'https://api-staging.audesp.gov.br',
      wsBaseURL: 'wss://api-staging.audesp.gov.br',
      logLevel: 'info',
      enableAnalytics: true,
      enableErrorReporting: true,
      corsOrigins: [
        'https://staging.audesp.gov.br',
        'https://api-staging.audesp.gov.br',
      ],
      maxUploadSize: 50 * 1024 * 1024,
      sessionTimeout: 60,
      jwtSecret: process.env.REACT_APP_JWT_SECRET || 'staging-secret',
    });

    // Production
    this.environments.set('production', {
      name: 'production',
      apiBaseURL: 'https://api.audesp.gov.br',
      wsBaseURL: 'wss://api.audesp.gov.br',
      logLevel: 'warn',
      enableAnalytics: true,
      enableErrorReporting: true,
      corsOrigins: [
        'https://audesp.gov.br',
        'https://www.audesp.gov.br',
        'https://api.audesp.gov.br',
      ],
      maxUploadSize: 50 * 1024 * 1024,
      sessionTimeout: 30, // 30 minutos em produção
      jwtSecret: process.env.REACT_APP_JWT_SECRET_PROD || 'CHANGE_THIS_IN_PRODUCTION',
    });
  }

  /**
   * Selecionar ambiente
   */
  setEnvironment(environmentName: 'development' | 'staging' | 'production'): Environment | null {
    const env = this.environments.get(environmentName);
    if (env) {
      this.currentEnvironment = env;
      console.log(`Ambiente alterado para: ${environmentName}`);
      return env;
    }
    return null;
  }

  /**
   * Obter ambiente atual
   */
  getEnvironment(): Environment {
    return this.currentEnvironment;
  }

  /**
   * Obter variável de configuração
   */
  getConfig<K extends keyof Environment>(key: K): Environment[K] {
    return this.currentEnvironment[key];
  }

  /**
   * Validar configurações
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar URLs
    if (!this.isValidURL(this.currentEnvironment.apiBaseURL)) {
      errors.push(`API URL inválida: ${this.currentEnvironment.apiBaseURL}`);
    }

    // Validar JWT Secret em produção
    if (
      this.currentEnvironment.name === 'production' &&
      this.currentEnvironment.jwtSecret === 'CHANGE_THIS_IN_PRODUCTION'
    ) {
      errors.push('JWT Secret não foi alterado em produção!');
    }

    // Validar tamanho máximo de upload
    if (this.currentEnvironment.maxUploadSize <= 0) {
      errors.push('Max upload size deve ser maior que 0');
    }

    // Validar timeout de sessão
    if (this.currentEnvironment.sessionTimeout <= 0) {
      errors.push('Session timeout deve ser maior que 0');
    }

    // Validar CORS origins
    if (this.currentEnvironment.corsOrigins.length === 0) {
      errors.push('Pelo menos uma CORS origin deve ser configurada');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Gerar checklist de deployment
   */
  generateDeploymentChecklist(): DeploymentChecklist[] {
    return [
      {
        item: 'Validar configurações',
        completed: this.validateConfiguration().valid,
        priority: 'high',
        description: 'Verificar se todas as configurações estão válidas',
      },
      {
        item: 'Executar testes',
        completed: false,
        priority: 'high',
        description: 'Rodar suite completa de testes',
      },
      {
        item: 'Build otimizado',
        completed: false,
        priority: 'high',
        description: 'Gerar build de produção',
      },
      {
        item: 'Backup de banco de dados',
        completed: false,
        priority: 'high',
        description: 'Realizar backup completo antes do deploy',
      },
      {
        item: 'Revisar logs',
        completed: false,
        priority: 'medium',
        description: 'Verificar logs para erros não tratados',
      },
      {
        item: 'Validar segurança',
        completed: false,
        priority: 'high',
        description: 'Rodar verificação de segurança',
      },
      {
        item: 'Testar endpoints críticos',
        completed: false,
        priority: 'high',
        description: 'Testar funcionalidades críticas antes do deploy',
      },
      {
        item: 'Notificar stakeholders',
        completed: false,
        priority: 'medium',
        description: 'Comunicar sobre a próxima janela de manutenção',
      },
      {
        item: 'Preparar rollback',
        completed: false,
        priority: 'high',
        description: 'Ter plano de rollback pronto',
      },
      {
        item: 'Monitoramento pós-deploy',
        completed: false,
        priority: 'high',
        description: 'Acompanhar métricas após o deploy',
      },
    ];
  }

  /**
   * Gerar relatório de deployment
   */
  generateDeploymentReport(): string {
    const checklist = this.generateDeploymentChecklist();
    const completed = checklist.filter((c) => c.completed).length;

    let report = '📦 RELATÓRIO DE DEPLOYMENT\n';
    report += '='.repeat(60) + '\n\n';

    report += `Ambiente: ${this.currentEnvironment.name.toUpperCase()}\n`;
    report += `Data de Deploy: ${this.deploymentDate.toLocaleString('pt-BR')}\n\n`;

    report += `Checklist de Preparação: ${completed}/${checklist.length}\n`;
    report += `Taxa de Conclusão: ${((completed / checklist.length) * 100).toFixed(0)}%\n\n`;

    report += 'CHECKLIST:\n';
    report += '-'.repeat(60) + '\n';

    checklist.forEach((item) => {
      const status = item.completed ? '✅' : '❌';
      report += `${status} [${item.priority.toUpperCase()}] ${item.item}\n`;
      report += `   ${item.description}\n`;
    });

    report += '\nCONFIGURAÇÕES:\n';
    report += '-'.repeat(60) + '\n';
    report += `API Base URL: ${this.currentEnvironment.apiBaseURL}\n`;
    report += `WebSocket URL: ${this.currentEnvironment.wsBaseURL}\n`;
    report += `Log Level: ${this.currentEnvironment.logLevel}\n`;
    report += `Analytics: ${this.currentEnvironment.enableAnalytics ? 'Ativado' : 'Desativado'}\n`;
    report += `Max Upload Size: ${this.formatBytes(this.currentEnvironment.maxUploadSize)}\n`;
    report += `Session Timeout: ${this.currentEnvironment.sessionTimeout} minutos\n`;

    return report;
  }

  /**
   * Exportar configurações
   */
  exportConfiguration(): Record<string, any> {
    const validation = this.validateConfiguration();

    return {
      environment: this.currentEnvironment.name,
      timestamp: new Date().toISOString(),
      deployment_date: this.deploymentDate.toISOString(),
      configuration: this.currentEnvironment,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
      },
    };
  }

  /**
   * Obter variáveis de ambiente
   */
  getEnvironmentVariables(): Record<string, string> {
    return {
      REACT_APP_API_BASE_URL: this.currentEnvironment.apiBaseURL,
      REACT_APP_WS_BASE_URL: this.currentEnvironment.wsBaseURL,
      REACT_APP_LOG_LEVEL: this.currentEnvironment.logLevel,
      REACT_APP_ANALYTICS_ENABLED: String(this.currentEnvironment.enableAnalytics),
      REACT_APP_ERROR_REPORTING: String(this.currentEnvironment.enableErrorReporting),
      REACT_APP_MAX_UPLOAD_SIZE: String(this.currentEnvironment.maxUploadSize),
      REACT_APP_SESSION_TIMEOUT: String(this.currentEnvironment.sessionTimeout),
    };
  }

  /**
   * Auxiliar: validar URL
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Auxiliar: formatar bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default DeploymentConfig.getInstance();
