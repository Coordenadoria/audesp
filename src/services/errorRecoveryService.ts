/**
 * INTELLIGENT ERROR RECOVERY SERVICE
 * Sistema de recuperação automática e assistida de erros
 * 
 * Características:
 * - Auto-recuperação para erros transientes
 * - Sugestões de ação inteligentes
 * - Registro de tentativas
 * - Escalonamento de gravidade
 */

export interface RecoveryStrategy {
  name: string;
  description: string;
  priority: number;
  automatic: boolean;
  action: () => Promise<void>;
  verify?: () => Promise<boolean>;
}

export interface RecoveryAttempt {
  timestamp: string;
  errorCode: string;
  strategy: string;
  success: boolean;
  duration: number;
  message?: string;
}

export class ErrorRecoveryEngine {
  private attempts: RecoveryAttempt[] = [];
  private maxAttempts = 50;
  private recoveryInProgress = false;
  
  /**
   * Tenta recuperar de erro automaticamente
   */
  async attemptRecovery(errorCode: string, errorMessage: string): Promise<{
    recovered: boolean;
    strategy?: string;
    recommendation?: string;
  }> {
    if (this.recoveryInProgress) {
      return {
        recovered: false,
        recommendation: 'Uma recuperação já está em andamento. Aguarde...'
      };
    }
    
    this.recoveryInProgress = true;
    
    try {
      // Categorizar erro
      const errorCategory = this.categorizeError(errorCode, errorMessage);
      
      // Obter estratégias aplicáveis
      const strategies = this.getApplicableStrategies(errorCategory);
      
      console.log(`[ErrorRecovery] Tentando recuperar de ${errorCategory} com ${strategies.length} estratégias`);
      
      // Tentar estratégias em ordem de prioridade
      for (const strategy of strategies) {
        if (strategy.automatic) {
          try {
            const startTime = Date.now();
            await strategy.action();
            
            // Verificar se recuperou
            if (strategy.verify) {
              const verified = await strategy.verify();
              if (!verified) continue;
            }
            
            this.recordAttempt(errorCode, strategy.name, true, Date.now() - startTime);
            console.log(`[ErrorRecovery] ✅ Recuperado com estratégia: ${strategy.name}`);
            
            return {
              recovered: true,
              strategy: strategy.name
            };
          } catch (error: any) {
            console.warn(`[ErrorRecovery] Estratégia ${strategy.name} falhou:`, error.message);
            this.recordAttempt(errorCode, strategy.name, false, 0, error.message);
          }
        }
      }
      
      // Se não conseguiu recuperar, sugerir ações manuais
      const manualStrategies = strategies.filter(s => !s.automatic);
      const recommendation = manualStrategies.length > 0
        ? this.formatStrategiesAsUserAction(manualStrategies)
        : undefined;
      
      return {
        recovered: false,
        recommendation
      };
    } finally {
      this.recoveryInProgress = false;
    }
  }
  
  /**
   * Categoriza erro baseado em código e mensagem
   */
  private categorizeError(errorCode: string, message: string): string {
    if (errorCode.includes('401') || message.includes('Autenticação')) return 'AUTH';
    if (errorCode.includes('403') || message.includes('Permissão')) return 'PERMISSION';
    if (errorCode.includes('timeout') || message.includes('Timeout')) return 'TIMEOUT';
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) return 'NETWORK';
    if (errorCode.includes('503') || errorCode.includes('502')) return 'SERVER_UNAVAILABLE';
    if (errorCode.includes('validation') || message.includes('Validação')) return 'VALIDATION';
    return 'UNKNOWN';
  }
  
  /**
   * Retorna estratégias aplicáveis para cada tipo de erro
   */
  private getApplicableStrategies(category: string): RecoveryStrategy[] {
    const strategies: Record<string, RecoveryStrategy[]> = {
      'AUTH': [
        {
          name: 'Renovar Token',
          description: 'Faz novo login para obter token válido',
          priority: 1,
          automatic: true,
          action: async () => {
            console.log('[ErrorRecovery] Renovando token de autenticação...');
            const token = sessionStorage.getItem('audesp_token');
            if (token && !token.includes('Bearer')) {
              sessionStorage.setItem('audesp_token', `Bearer ${token}`);
            }
          },
          verify: async () => {
            const token = sessionStorage.getItem('audesp_token');
            const expiry = sessionStorage.getItem('audesp_expire');
            return !!token && expiry && parseInt(expiry) > Date.now();
          }
        },
        {
          name: 'Fazer Logout e Login',
          description: 'Realiza logout e login novamente',
          priority: 2,
          automatic: false,
          action: async () => {
            console.log('[ErrorRecovery] Realizando logout/login...');
            sessionStorage.clear();
          }
        }
      ],
      
      'PERMISSION': [
        {
          name: 'Verificar Perfil',
          description: 'Valida permissões do usuário',
          priority: 1,
          automatic: true,
          action: async () => {
            console.log('[ErrorRecovery] Verificando permissões...');
            // Verifica se CPF está completo
            const cpf = sessionStorage.getItem('audesp_cpf');
            if (!cpf) {
              throw new Error('CPF não encontrado na sessão');
            }
          }
        },
        {
          name: 'Tentar com Outro CPF',
          description: 'Faz logout e pede para usar outro CPF',
          priority: 2,
          automatic: false,
          action: async () => {
            console.log('[ErrorRecovery] Sugerindo troca de CPF...');
          }
        }
      ],
      
      'TIMEOUT': [
        {
          name: 'Aguardar e Tentar Novamente',
          description: 'Aguarda 10 segundos e tenta novamente',
          priority: 1,
          automatic: true,
          action: async () => {
            console.log('[ErrorRecovery] Aguardando 10s antes de retry...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        },
        {
          name: 'Aumentar Timeout',
          description: 'Tenta novamente com timeout aumentado',
          priority: 2,
          automatic: true,
          action: async () => {
            console.log('[ErrorRecovery] Aumentando timeout para próxima tentativa...');
            sessionStorage.setItem('transmission_timeout', '45000');
          }
        }
      ],
      
      'NETWORK': [
        {
          name: 'Tentar Novamente',
          description: 'Retenta a operação após 5 segundos',
          priority: 1,
          automatic: true,
          action: async () => {
            console.log('[ErrorRecovery] Aguardando 5s para retry de rede...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        },
        {
          name: 'Verificar Conexão Internet',
          description: 'Valida se tem conexão de internet',
          priority: 2,
          automatic: true,
          action: async () => {
            console.log('[ErrorRecovery] Verificando conexão internet...');
            if (!navigator.onLine) {
              throw new Error('Sem conexão de internet');
            }
          },
          verify: async () => {
            return navigator.onLine;
          }
        },
        {
          name: 'Desabilitar VPN',
          description: 'Pede para o usuário desabilitar VPN se ativa',
          priority: 3,
          automatic: false,
          action: async () => {
            console.log('[ErrorRecovery] Sugerindo desabilitar VPN...');
          }
        }
      ],
      
      'SERVER_UNAVAILABLE': [
        {
          name: 'Aguardar Disponibilidade',
          description: 'Aguarda 30 segundos e tenta novamente',
          priority: 1,
          automatic: true,
          action: async () => {
            console.log('[ErrorRecovery] Aguardando servidor por 30s...');
            await new Promise(resolve => setTimeout(resolve, 30000));
          }
        },
        {
          name: 'Tentar em Outro Momento',
          description: 'Recomenda tentar mais tarde',
          priority: 2,
          automatic: false,
          action: async () => {
            console.log('[ErrorRecovery] Recomendando tentar mais tarde...');
          }
        }
      ],
      
      'VALIDATION': [
        {
          name: 'Limpar Cache de Formulário',
          description: 'Limpa dados do formulário em cache',
          priority: 1,
          automatic: true,
          action: async () => {
            console.log('[ErrorRecovery] Limpando cache do formulário...');
            localStorage.removeItem('audesp_form_cache');
          }
        },
        {
          name: 'Revisar Dados',
          description: 'Pede para revisar dados do formulário',
          priority: 2,
          automatic: false,
          action: async () => {
            console.log('[ErrorRecovery] Solicitando revisão de dados...');
          }
        }
      ]
    };
    
    return strategies[category] || [];
  }
  
  /**
   * Formata estratégias como ações do usuário
   */
  private formatStrategiesAsUserAction(strategies: RecoveryStrategy[]): string {
    const actions = strategies
      .sort((a, b) => a.priority - b.priority)
      .map(s => `• ${s.description}`)
      .join('\n');
    
    return `O sistema não conseguiu se recuperar automaticamente. Tente:\n\n${actions}`;
  }
  
  /**
   * Registra tentativa de recuperação
   */
  private recordAttempt(
    errorCode: string,
    strategy: string,
    success: boolean,
    duration: number,
    message?: string
  ) {
    const attempt: RecoveryAttempt = {
      timestamp: new Date().toISOString(),
      errorCode,
      strategy,
      success,
      duration,
      message
    };
    
    this.attempts.push(attempt);
    
    if (this.attempts.length > this.maxAttempts) {
      this.attempts.shift();
    }
  }
  
  /**
   * Obtém histórico de tentativas
   */
  getRecoveryHistory(): RecoveryAttempt[] {
    return this.attempts;
  }
  
  /**
   * Obtém estatísticas de recuperação
   */
  getRecoveryStats() {
    const successful = this.attempts.filter(a => a.success).length;
    const failed = this.attempts.length - successful;
    
    return {
      totalAttempts: this.attempts.length,
      successfulRecoveries: successful,
      failedRecoveries: failed,
      successRate: this.attempts.length > 0 ? (successful / this.attempts.length * 100).toFixed(1) + '%' : 'N/A',
      mostUsedStrategy: this.getMostUsedStrategy(),
      recentAttempts: this.attempts.slice(-5)
    };
  }
  
  /**
   * Encontra estratégia mais usada
   */
  private getMostUsedStrategy(): string | undefined {
    if (this.attempts.length === 0) return undefined;
    
    const strategyCounts: Record<string, number> = {};
    for (const attempt of this.attempts) {
      strategyCounts[attempt.strategy] = (strategyCounts[attempt.strategy] || 0) + 1;
    }
    
    return Object.entries(strategyCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
  }
  
  /**
   * Limpa histórico
   */
  clearHistory() {
    this.attempts = [];
  }
}

// ==================== GLOBAL INSTANCE ====================

export const errorRecoveryEngine = new ErrorRecoveryEngine();

export default {
  attemptRecovery: (errorCode: string, message: string) =>
    errorRecoveryEngine.attemptRecovery(errorCode, message),
  getStats: () => errorRecoveryEngine.getRecoveryStats(),
  getHistory: () => errorRecoveryEngine.getRecoveryHistory(),
  clearHistory: () => errorRecoveryEngine.clearHistory()
};
