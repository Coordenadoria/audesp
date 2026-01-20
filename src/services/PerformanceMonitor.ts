/**
 * PerformanceMonitor - Monitoramento de performance em tempo real
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  threshold?: number;
  status: 'good' | 'warning' | 'critical';
}

export interface PagePerformance {
  url: string;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  timestamp: Date;
}

export interface ResourceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: number;
  networkLatency: number;
  apiResponseTime: number;
  timestamp: Date;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private pageMetrics: PagePerformance[] = [];
  private resourceMetrics: ResourceMetrics[] = [];
  private isMonitoring: boolean = false;
  private updateInterval: NodeJS.Timer | null = null;

  private constructor() {
    this.initializePerformanceObserver();
  }

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * Inicializar Performance Observer
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // Observar Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Observar Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime, 'ms', 2500);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observar First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric('FID', entry.processingDuration, 'ms', 100);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Observar Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += (entry as any).value;
              this.recordMetric('CLS', clsValue, 'score', 0.1);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        console.log('Performance monitoring initialized');
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Capturar First Contentful Paint (FCP)
    if ('PerformancePaintTiming' in window) {
      const paintEntries = window.performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime, 'ms', 1800);
        }
      });
    }

    // Capturar Time to First Byte (TTFB)
    const navigationTiming = window.performance.getEntriesByType('navigation')[0];
    if (navigationTiming) {
      const ttfb = (navigationTiming as PerformanceNavigationTiming).responseStart;
      this.recordMetric('TTFB', ttfb, 'ms', 600);
    }
  }

  /**
   * Registrar métrica de performance
   */
  private recordMetric(
    name: string,
    value: number,
    unit: string,
    threshold?: number,
  ): void {
    const status = this.getMetricStatus(value, threshold);

    const metric: PerformanceMetric = {
      name,
      value: Math.round(value * 100) / 100,
      unit,
      timestamp: new Date(),
      threshold,
      status,
    };

    this.metrics.push(metric);

    // Manter apenas últimas 100 métricas
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    if (status === 'critical') {
      console.warn(`⚠️ Métrica crítica: ${name} = ${value}${unit} (limiar: ${threshold}${unit})`);
    }
  }

  /**
   * Determinar status da métrica
   */
  private getMetricStatus(
    value: number,
    threshold?: number,
  ): 'good' | 'warning' | 'critical' {
    if (!threshold) return 'good';

    if (value > threshold * 1.5) return 'critical';
    if (value > threshold) return 'warning';
    return 'good';
  }

  /**
   * Iniciar monitoramento contínuo
   */
  startMonitoring(interval: number = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.updateInterval = setInterval(() => {
      this.capturePageMetrics();
      this.captureResourceMetrics();
    }, interval);

    console.log(`Performance monitoring started (interval: ${interval}ms)`);
  }

  /**
   * Parar monitoramento
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.isMonitoring = false;
      console.log('Performance monitoring stopped');
    }
  }

  /**
   * Capturar métricas da página
   */
  private capturePageMetrics(): void {
    if (typeof window === 'undefined') return;

    const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigationTiming) return;

    const pagePerf: PagePerformance = {
      url: window.location.href,
      fcp: navigationTiming.responseStart,
      lcp: 0, // Será preenchido pelo Observer
      fid: 0, // Será preenchido pelo Observer
      cls: 0, // Será preenchido pelo Observer
      ttfb: navigationTiming.responseStart,
      timestamp: new Date(),
    };

    this.pageMetrics.push(pagePerf);

    // Manter apenas últimas 50 medições
    if (this.pageMetrics.length > 50) {
      this.pageMetrics.shift();
    }
  }

  /**
   * Capturar métricas de recursos (simulado)
   */
  private captureResourceMetrics(): void {
    const resourceMetric: ResourceMetrics = {
      memory: {
        used: Math.random() * 100,
        total: 100,
        percentage: Math.random() * 80,
      },
      cpu: Math.random() * 60,
      networkLatency: Math.random() * 100 + 20,
      apiResponseTime: Math.random() * 500 + 100,
      timestamp: new Date(),
    };

    this.resourceMetrics.push(resourceMetric);

    // Manter apenas últimas 50 medições
    if (this.resourceMetrics.length > 50) {
      this.resourceMetrics.shift();
    }
  }

  /**
   * Obter todas as métricas
   */
  getMetrics(limit: number = 20): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Obter métricas de página
   */
  getPageMetrics(limit: number = 10): PagePerformance[] {
    return this.pageMetrics.slice(-limit);
  }

  /**
   * Obter métricas de recursos
   */
  getResourceMetrics(limit: number = 10): ResourceMetrics[] {
    return this.resourceMetrics.slice(-limit);
  }

  /**
   * Gerar relatório de performance
   */
  generatePerformanceReport(): string {
    const lastPageMetric = this.pageMetrics[this.pageMetrics.length - 1];
    const criticalMetrics = this.metrics.filter((m) => m.status === 'critical');
    const warningMetrics = this.metrics.filter((m) => m.status === 'warning');

    let report = '⚡ RELATÓRIO DE PERFORMANCE\n';
    report += '='.repeat(70) + '\n\n';

    report += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`;
    report += `Página: ${lastPageMetric?.url || 'N/A'}\n\n`;

    report += 'MÉTRICAS CRÍTICAS:\n';
    report += '-'.repeat(70) + '\n';
    if (criticalMetrics.length > 0) {
      criticalMetrics.forEach((m) => {
        report += `❌ ${m.name}: ${m.value}${m.unit} (limiar: ${m.threshold}${m.unit})\n`;
      });
    } else {
      report += '✅ Nenhuma métrica crítica\n';
    }

    report += '\nMÉTRICAS DE AVISO:\n';
    report += '-'.repeat(70) + '\n';
    if (warningMetrics.length > 0) {
      warningMetrics.forEach((m) => {
        report += `⚠️  ${m.name}: ${m.value}${m.unit} (limiar: ${m.threshold}${m.unit})\n`;
      });
    } else {
      report += '✅ Nenhuma métrica de aviso\n';
    }

    report += '\nWEB VITALS:\n';
    report += '-'.repeat(70) + '\n';
    if (lastPageMetric) {
      report += `First Contentful Paint (FCP): ${lastPageMetric.fcp}ms\n`;
      report += `Largest Contentful Paint (LCP): ${lastPageMetric.lcp}ms\n`;
      report += `First Input Delay (FID): ${lastPageMetric.fid}ms\n`;
      report += `Cumulative Layout Shift (CLS): ${lastPageMetric.cls.toFixed(3)}\n`;
      report += `Time to First Byte (TTFB): ${lastPageMetric.ttfb}ms\n`;
    } else {
      report += 'Dados não disponíveis\n';
    }

    report += '\nESTATÍSTICAS:\n';
    report += '-'.repeat(70) + '\n';
    report += `Total de Métricas Coletadas: ${this.metrics.length}\n`;
    report += `Métricas Críticas: ${criticalMetrics.length}\n`;
    report += `Métricas de Aviso: ${warningMetrics.length}\n`;
    report += `Medições de Página: ${this.pageMetrics.length}\n`;
    report += `Medições de Recursos: ${this.resourceMetrics.length}\n`;

    return report;
  }

  /**
   * Exportar dados de performance
   */
  exportMetrics(): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      pageMetrics: this.pageMetrics,
      resourceMetrics: this.resourceMetrics,
      summary: {
        totalMetrics: this.metrics.length,
        criticalCount: this.metrics.filter((m) => m.status === 'critical').length,
        warningCount: this.metrics.filter((m) => m.status === 'warning').length,
      },
    };
  }

  /**
   * Limpar dados (útil para testes)
   */
  clearMetrics(): void {
    this.metrics = [];
    this.pageMetrics = [];
    this.resourceMetrics = [];
  }
}

export default PerformanceMonitor.getInstance();
