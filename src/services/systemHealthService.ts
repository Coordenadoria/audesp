/**
 * SYSTEM HEALTH CHECK SERVICE
 * Monitora a saúde do sistema, conectividade e disponibilidade
 * 
 * Fornece insights em tempo real:
 * - Status da conexão Audesp
 * - Performance de transmissão
 * - Anomalias detectadas
 * - Recomendações automáticas
 */

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  lastCheck: string;
  components: HealthComponent[];
  recommendations: string[];
  metrics: HealthMetrics;
}

export interface HealthComponent {
  name: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  latency?: number;
  message?: string;
}

export interface HealthMetrics {
  uptime: number;
  transmissionSuccessRate: number;
  averageLatency: number;
  errorRate: number;
  lastErrorTime?: string;
}

// ==================== IN-MEMORY METRICS ====================

class MetricsCollector {
  private transmissions: Array<{
    success: boolean;
    duration: number;
    timestamp: number;
    errorType?: string;
  }> = [];
  
  private startTime = Date.now();
  private maxRecords = 100;
  
  recordTransmission(success: boolean, duration: number, errorType?: string) {
    this.transmissions.push({
      success,
      duration,
      timestamp: Date.now(),
      errorType
    });
    
    // Manter apenas os últimos 100 registros
    if (this.transmissions.length > this.maxRecords) {
      this.transmissions.shift();
    }
  }
  
  getMetrics(): HealthMetrics {
    const uptime = (Date.now() - this.startTime) / 1000; // em segundos
    const total = this.transmissions.length || 1;
    const successful = this.transmissions.filter(t => t.success).length;
    const failed = total - successful;
    const avgLatency = this.transmissions.length > 0
      ? this.transmissions.reduce((sum, t) => sum + t.duration, 0) / total
      : 0;
    
    const lastError = this.transmissions
      .filter(t => !t.success)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    return {
      uptime,
      transmissionSuccessRate: successful / total,
      averageLatency: Math.round(avgLatency),
      errorRate: failed / total,
      lastErrorTime: lastError ? new Date(lastError.timestamp).toISOString() : undefined
    };
  }
  
  clear() {
    this.transmissions = [];
  }
}

const metricsCollector = new MetricsCollector();

// ==================== CONNECTIVITY CHECKS ====================

export class SystemHealthChecker {
  /**
   * Verifica saúde geral do sistema
   */
  static async checkSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkAuthenticationService(),
      this.checkAudespConnectivity(),
      this.checkLocalStorage(),
      this.checkTokenValidity(),
      this.checkNetworkQuality()
    ]);
    
    const metrics = metricsCollector.getMetrics();
    const allComponents = checks.flat();
    const hasErrors = allComponents.some(c => c.status === 'ERROR');
    const hasWarnings = allComponents.some(c => c.status === 'WARNING');
    
    const status = hasErrors ? 'CRITICAL' : hasWarnings ? 'DEGRADED' : 'HEALTHY';
    
    const recommendations = this.generateRecommendations(allComponents, metrics);
    
    return {
      status,
      lastCheck: new Date().toISOString(),
      components: allComponents,
      recommendations,
      metrics
    };
  }
  
  /**
   * Verifica autenticação
   */
  private static async checkAuthenticationService(): Promise<HealthComponent[]> {
    const token = sessionStorage.getItem('audesp_token');
    const expiry = sessionStorage.getItem('audesp_expire');
    
    const hasToken = !!token;
    const tokenValid = expiry ? parseInt(expiry) > Date.now() : false;
    
    return [
      {
        name: 'Autenticação',
        status: hasToken ? 'OK' : 'WARNING',
        message: hasToken ? 'Token presente' : 'Usuário não autenticado'
      },
      {
        name: 'Validade do Token',
        status: tokenValid ? 'OK' : 'WARNING',
        message: tokenValid ? 'Token válido' : 'Token expirado ou vencido'
      }
    ];
  }
  
  /**
   * Verifica conectividade com Audesp
   */
  private static async checkAudespConnectivity(): Promise<HealthComponent[]> {
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const testUrl = isLocalhost
      ? '/proxy-piloto-f5/test'
      : 'https://audesp-piloto.tce.sp.gov.br/health';
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);
      
      const latency = Date.now() - startTime;
      
      if (!response) {
        return [{
          name: 'Conectividade Audesp',
          status: 'ERROR',
          latency,
          message: 'Servidor Audesp indisponível'
        }];
      }
      
      const status = response.ok || response.status === 404 ? 'OK' : 'WARNING';
      
      return [{
        name: 'Conectividade Audesp',
        status,
        latency,
        message: `HTTP ${response.status} (${latency}ms)`
      }];
    } catch (error: any) {
      return [{
        name: 'Conectividade Audesp',
        status: 'ERROR',
        message: error.name === 'AbortError' ? 'Timeout (>5s)' : 'Erro de conexão'
      }];
    }
  }
  
  /**
   * Verifica armazenamento local
   */
  private static checkLocalStorage(): HealthComponent[] {
    try {
      const test = '__health_check__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      
      return [{
        name: 'Armazenamento Local',
        status: 'OK',
        message: 'SessionStorage funcional'
      }];
    } catch {
      return [{
        name: 'Armazenamento Local',
        status: 'ERROR',
        message: 'SessionStorage indisponível'
      }];
    }
  }
  
  /**
   * Verifica validade do token
   */
  private static checkTokenValidity(): HealthComponent[] {
    const token = sessionStorage.getItem('audesp_token');
    const expiry = sessionStorage.getItem('audesp_expire');
    
    if (!token || !expiry) {
      return [{
        name: 'Token JWT',
        status: 'WARNING',
        message: 'Nenhum token encontrado'
      }];
    }
    
    const timeRemaining = parseInt(expiry) - Date.now();
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    
    if (timeRemaining < 0) {
      return [{
        name: 'Token JWT',
        status: 'ERROR',
        message: 'Token expirado'
      }];
    }
    
    if (hoursRemaining < 1) {
      return [{
        name: 'Token JWT',
        status: 'WARNING',
        message: `Expira em ${Math.round(hoursRemaining * 60)} minutos`
      }];
    }
    
    return [{
      name: 'Token JWT',
      status: 'OK',
      message: `Válido por ${Math.round(hoursRemaining)} horas`
    }];
  }
  
  /**
   * Verifica qualidade da rede
   */
  private static async checkNetworkQuality(): Promise<HealthComponent[]> {
    // Verificar dados de navegador sobre conexão
    const connection = (navigator as any).connection || (navigator as any).mozConnection;
    
    if (!connection) {
      return [{
        name: 'Qualidade da Rede',
        status: 'OK',
        message: 'Não detectada (pode estar OK)'
      }];
    }
    
    const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
    const saveData = connection.saveData;
    
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';
    let message = effectiveType.toUpperCase();
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      status = 'WARNING';
      message += ' ⚠️ (pode ser lento)';
    }
    
    if (saveData) {
      status = 'WARNING';
      message += ' (data saver ativado)';
    }
    
    return [{
      name: 'Qualidade da Rede',
      status,
      message
    }];
  }
  
  /**
   * Gera recomendações baseadas nos componentes
   */
  private static generateRecommendations(components: HealthComponent[], metrics: HealthMetrics): string[] {
    const recommendations: string[] = [];
    
    // Problemas de autenticação
    const authError = components.find(c => c.name === 'Autenticação' && c.status === 'ERROR');
    if (authError) {
      recommendations.push('🔑 Faça login para continuar');
    }
    
    // Token expirado
    const tokenError = components.find(c => c.name === 'Validade do Token' && c.status === 'ERROR');
    if (tokenError) {
      recommendations.push('🔄 Token expirado - faça logout e login novamente');
    }
    
    // Servidor indisponível
    const serverError = components.find(c => c.name === 'Conectividade Audesp' && c.status === 'ERROR');
    if (serverError) {
      recommendations.push('📡 Audesp pode estar indisponível - tente em alguns minutos');
    }
    
    // Taxa de erro alta
    if (metrics.errorRate > 0.3) {
      recommendations.push('⚠️ Taxa de erros acima de 30% - tente mais tarde');
    }
    
    // Latência alta
    if (metrics.averageLatency > 5000) {
      recommendations.push('🐢 Rede lenta detectada - tente evitar picos de uso');
    }
    
    // Storage indisponível
    const storageError = components.find(c => c.name === 'Armazenamento Local' && c.status === 'ERROR');
    if (storageError) {
      recommendations.push('💾 Armazenamento local indisponível - navegador pode estar no modo privado');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Sistema operacional normalmente');
    }
    
    return recommendations;
  }
}

// ==================== PERFORMANCE MONITORING ====================

export class PerformanceMonitor {
  /**
   * Registra métrica de transmissão
   */
  static recordTransmission(success: boolean, duration: number, errorType?: string) {
    metricsCollector.recordTransmission(success, duration, errorType);
  }
  
  /**
   * Obtém histórico de performance
   */
  static getPerformanceReport() {
    const metrics = metricsCollector.getMetrics();
    
    return {
      summary: {
        healthScore: Math.round(metrics.transmissionSuccessRate * 100),
        status: metrics.transmissionSuccessRate > 0.95 ? 'EXCELLENT' : metrics.transmissionSuccessRate > 0.8 ? 'GOOD' : 'NEEDS_ATTENTION'
      },
      details: {
        totalTransmissions: (metricsCollector as any).transmissions.length,
        successRate: `${Math.round(metrics.transmissionSuccessRate * 100)}%`,
        errorRate: `${Math.round(metrics.errorRate * 100)}%`,
        averageLatency: `${metrics.averageLatency}ms`,
        uptime: `${Math.round(metrics.uptime / 60)}min`,
        lastError: metrics.lastErrorTime
      }
    };
  }
  
  /**
   * Limpa histórico de métricas
   */
  static clearMetrics() {
    metricsCollector.clear();
  }
}

// ==================== EXPORT ====================

export default {
  SystemHealthChecker,
  PerformanceMonitor,
  recordTransmission: PerformanceMonitor.recordTransmission,
  getSystemHealth: () => SystemHealthChecker.checkSystemHealth(),
  getPerformanceReport: () => PerformanceMonitor.getPerformanceReport()
};
