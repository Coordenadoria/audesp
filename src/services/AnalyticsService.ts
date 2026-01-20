/**
 * AnalyticsService - Serviço de analytics e monitoramento de eventos
 */

export interface AnalyticsEvent {
  eventName: string;
  category: string;
  value?: number;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  errorId: string;
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ConversionEvent {
  conversionId: string;
  conversionType: string;
  value: number;
  currency: string;
  timestamp: Date;
  userId?: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];
  private errors: ErrorEvent[] = [];
  private conversions: ConversionEvent[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private enabled: boolean = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorTracking();
  }

  static getInstance(): AnalyticsService {
    if (!this.instance) {
      this.instance = new AnalyticsService();
    }
    return this.instance;
  }

  /**
   * Habilitar/desabilitar analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Definir ID do usuário
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Rastrear evento
   */
  trackEvent(
    eventName: string,
    category: string,
    value?: number,
    metadata?: Record<string, any>,
  ): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      eventName,
      category,
      value,
      timestamp: new Date(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      metadata,
    };

    this.events.push(event);

    // Manter apenas últimos 500 eventos
    if (this.events.length > 500) {
      this.events.shift();
    }

    console.log(`📊 Event tracked: ${eventName} (${category})`);

    // Enviar para servidor de analytics em background
    this.sendToAnalyticsServer(event);
  }

  /**
   * Rastrear clique
   */
  trackClick(elementId: string, metadata?: Record<string, any>): void {
    this.trackEvent('click', 'user_interaction', undefined, {
      elementId,
      ...metadata,
    });
  }

  /**
   * Rastrear visualização de página
   */
  trackPageView(pageName: string, metadata?: Record<string, any>): void {
    this.trackEvent('page_view', 'navigation', undefined, {
      pageName,
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      ...metadata,
    });
  }

  /**
   * Rastrear envio de formulário
   */
  trackFormSubmission(formName: string, fieldCount: number): void {
    this.trackEvent('form_submission', 'form', fieldCount, {
      formName,
    });
  }

  /**
   * Rastrear erro
   */
  trackError(
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    stack?: string,
    context?: Record<string, any>,
  ): void {
    if (!this.enabled) return;

    const errorId = this.generateErrorId();
    const error: ErrorEvent = {
      errorId,
      message,
      stack,
      severity,
      timestamp: new Date(),
      context: {
        sessionId: this.sessionId,
        userId: this.userId,
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
        ...context,
      },
    };

    this.errors.push(error);

    // Manter apenas últimos 100 erros
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    console.error(`❌ Error tracked (${severity}): ${message}`);

    // Enviar erro crítico imediatamente
    if (severity === 'critical') {
      this.sendErrorToServer(error);
    }
  }

  /**
   * Rastrear conversão
   */
  trackConversion(
    conversionType: string,
    value: number,
    currency: string = 'BRL',
  ): void {
    if (!this.enabled) return;

    const conversion: ConversionEvent = {
      conversionId: this.generateConversionId(),
      conversionType,
      value,
      currency,
      timestamp: new Date(),
      userId: this.userId || undefined,
    };

    this.conversions.push(conversion);

    // Manter apenas últimas 200 conversões
    if (this.conversions.length > 200) {
      this.conversions.shift();
    }

    console.log(`💰 Conversion tracked: ${conversionType} (${currency} ${value})`);

    // Enviar para servidor imediatamente
    this.sendConversionToServer(conversion);
  }

  /**
   * Rastrear tempo de carregamento
   */
  trackLoadTime(componentName: string, loadTime: number): void {
    this.trackEvent('load_time', 'performance', loadTime, {
      componentName,
    });
  }

  /**
   * Rastrear API call
   */
  trackAPICall(endpoint: string, method: string, status: number, duration: number): void {
    this.trackEvent('api_call', 'api', duration, {
      endpoint,
      method,
      status,
    });
  }

  /**
   * Inicializar rastreamento de erros
   */
  private initializeErrorTracking(): void {
    if (typeof window === 'undefined') return;

    // Rastrear erros não capturados
    window.addEventListener('error', (event) => {
      this.trackError(
        event.message,
        'high',
        event.error?.stack,
        {
          type: 'uncaught_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      );
    });

    // Rastrear promessas rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        event.reason?.message || String(event.reason),
        'high',
        event.reason?.stack,
        {
          type: 'unhandled_rejection',
        },
      );
    });
  }

  /**
   * Enviar evento para servidor (async)
   */
  private sendToAnalyticsServer(event: AnalyticsEvent): void {
    if (typeof fetch === 'undefined') return;

    // Enviar em background
    setTimeout(() => {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch((error) => console.warn('Failed to send analytics event:', error));
    }, 0);
  }

  /**
   * Enviar erro para servidor
   */
  private sendErrorToServer(error: ErrorEvent): void {
    if (typeof fetch === 'undefined') return;

    fetch('/api/analytics/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error),
    }).catch((error) => console.warn('Failed to send error report:', error));
  }

  /**
   * Enviar conversão para servidor
   */
  private sendConversionToServer(conversion: ConversionEvent): void {
    if (typeof fetch === 'undefined') return;

    fetch('/api/analytics/conversions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversion),
    }).catch((error) => console.warn('Failed to send conversion:', error));
  }

  /**
   * Obter eventos
   */
  getEvents(limit: number = 50): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Obter erros
   */
  getErrors(limit: number = 20): ErrorEvent[] {
    return this.errors.slice(-limit);
  }

  /**
   * Obter conversões
   */
  getConversions(limit: number = 20): ConversionEvent[] {
    return this.conversions.slice(-limit);
  }

  /**
   * Gerar relatório
   */
  generateAnalyticsReport(): string {
    const eventsByCategory = this.groupEventsByCategory();
    const totalConversionValue = this.conversions.reduce((sum, c) => sum + c.value, 0);
    const criticalErrors = this.errors.filter((e) => e.severity === 'critical').length;

    let report = '📊 RELATÓRIO DE ANALYTICS\n';
    report += '='.repeat(70) + '\n\n';

    report += `Session ID: ${this.sessionId}\n`;
    report += `User ID: ${this.userId || 'Anonymous'}\n`;
    report += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n`;

    report += 'EVENTOS:\n';
    report += '-'.repeat(70) + '\n';
    report += `Total de Eventos: ${this.events.length}\n`;
    report += `Categorias: ${Object.keys(eventsByCategory).join(', ')}\n\n`;

    Object.entries(eventsByCategory).forEach(([category, count]) => {
      report += `${category}: ${count}\n`;
    });

    report += '\nERROS:\n';
    report += '-'.repeat(70) + '\n';
    report += `Total de Erros: ${this.errors.length}\n`;
    report += `Erros Críticos: ${criticalErrors}\n`;

    const errorBySeverity: Record<string, number> = {};
    this.errors.forEach((e) => {
      errorBySeverity[e.severity] = (errorBySeverity[e.severity] || 0) + 1;
    });
    Object.entries(errorBySeverity).forEach(([severity, count]) => {
      report += `${severity}: ${count}\n`;
    });

    report += '\nCONVERSÕES:\n';
    report += '-'.repeat(70) + '\n';
    report += `Total de Conversões: ${this.conversions.length}\n`;
    report += `Valor Total: R$ ${totalConversionValue.toFixed(2)}\n`;

    return report;
  }

  /**
   * Agrupar eventos por categoria
   */
  private groupEventsByCategory(): Record<string, number> {
    const grouped: Record<string, number> = {};
    this.events.forEach((event) => {
      grouped[event.category] = (grouped[event.category] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Gerar IDs únicos
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConversionId(): string {
    return `conversion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpar dados (útil para testes)
   */
  clearData(): void {
    this.events = [];
    this.errors = [];
    this.conversions = [];
  }
}

export default AnalyticsService.getInstance();
