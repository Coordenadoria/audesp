/**
 * CIPipelineService - Serviço para gerenciar pipeline CI/CD
 */

export interface BuildResult {
  success: boolean;
  timestamp: Date;
  duration: number; // em ms
  errors: string[];
  warnings: string[];
  version: string;
}

export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number; // em ms
  timestamp: Date;
}

export interface SecurityCheckResult {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  timestamp: Date;
  passed: boolean;
}

export interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  duration?: number; // em ms
  error?: string;
}

export interface DeploymentPipeline {
  id: string;
  branch: string;
  commit: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'success' | 'failed';
  stages: PipelineStage[];
}

export class CIPipelineService {
  private static instance: CIPipelineService;
  private pipelines: Map<string, DeploymentPipeline> = new Map();
  private buildHistory: BuildResult[] = [];
  private testHistory: TestResult[] = [];
  private securityHistory: SecurityCheckResult[] = [];
  private currentPipeline: DeploymentPipeline | null = null;

  private constructor() {
    console.log('CIPipelineService initialized');
  }

  static getInstance(): CIPipelineService {
    if (!this.instance) {
      this.instance = new CIPipelineService();
    }
    return this.instance;
  }

  /**
   * Iniciar novo pipeline
   */
  startPipeline(branch: string, commit: string): DeploymentPipeline {
    const pipelineId = this.generatePipelineId();
    const pipeline: DeploymentPipeline = {
      id: pipelineId,
      branch,
      commit,
      startTime: new Date(),
      status: 'running',
      stages: [
        { name: 'Checkout', status: 'pending' },
        { name: 'Install Dependencies', status: 'pending' },
        { name: 'Lint', status: 'pending' },
        { name: 'Type Check', status: 'pending' },
        { name: 'Tests', status: 'pending' },
        { name: 'Security Scan', status: 'pending' },
        { name: 'Build', status: 'pending' },
        { name: 'Deploy', status: 'pending' },
      ],
    };

    this.pipelines.set(pipelineId, pipeline);
    this.currentPipeline = pipeline;

    console.log(`Pipeline iniciado: ${pipelineId} (${branch}@${commit})`);
    return pipeline;
  }

  /**
   * Atualizar status de um estágio
   */
  updateStageStatus(
    pipelineId: string,
    stageName: string,
    status: 'running' | 'success' | 'failed' | 'skipped',
    error?: string,
    duration?: number,
  ): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    const stage = pipeline.stages.find((s) => s.name === stageName);
    if (!stage) return false;

    stage.status = status;
    if (error) stage.error = error;
    if (duration) stage.duration = duration;

    // Se falhar um estágio, marcar pipeline como failed
    if (status === 'failed') {
      pipeline.status = 'failed';
      pipeline.endTime = new Date();
    }

    return true;
  }

  /**
   * Finalizar pipeline com sucesso
   */
  completePipeline(pipelineId: string): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    pipeline.status = 'success';
    pipeline.endTime = new Date();

    console.log(`Pipeline concluído com sucesso: ${pipelineId}`);
    return true;
  }

  /**
   * Registrar resultado de build
   */
  recordBuildResult(result: BuildResult): void {
    this.buildHistory.push(result);

    // Manter apenas últimos 50 builds
    if (this.buildHistory.length > 50) {
      this.buildHistory.shift();
    }
  }

  /**
   * Registrar resultado de testes
   */
  recordTestResult(result: TestResult): void {
    this.testHistory.push(result);

    // Manter apenas últimos 50 execuções
    if (this.testHistory.length > 50) {
      this.testHistory.shift();
    }
  }

  /**
   * Registrar resultado de verificação de segurança
   */
  recordSecurityCheck(result: SecurityCheckResult): void {
    this.securityHistory.push(result);

    // Manter apenas últimos 50 verificações
    if (this.securityHistory.length > 50) {
      this.securityHistory.shift();
    }
  }

  /**
   * Obter pipeline por ID
   */
  getPipeline(pipelineId: string): DeploymentPipeline | null {
    return this.pipelines.get(pipelineId) || null;
  }

  /**
   * Obter pipeline atual
   */
  getCurrentPipeline(): DeploymentPipeline | null {
    return this.currentPipeline;
  }

  /**
   * Obter histórico de builds
   */
  getBuildHistory(limit: number = 10): BuildResult[] {
    return this.buildHistory.slice(-limit).reverse();
  }

  /**
   * Obter histórico de testes
   */
  getTestHistory(limit: number = 10): TestResult[] {
    return this.testHistory.slice(-limit).reverse();
  }

  /**
   * Obter histórico de segurança
   */
  getSecurityHistory(limit: number = 10): SecurityCheckResult[] {
    return this.securityHistory.slice(-limit).reverse();
  }

  /**
   * Gerar relatório de pipeline
   */
  generatePipelineReport(pipelineId: string): string {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return 'Pipeline não encontrado';

    const duration = pipeline.endTime
      ? (pipeline.endTime.getTime() - pipeline.startTime.getTime()) / 1000
      : 0;

    let report = '🔄 RELATÓRIO DE PIPELINE CI/CD\n';
    report += '='.repeat(70) + '\n\n';

    report += `ID do Pipeline: ${pipeline.id}\n`;
    report += `Branch: ${pipeline.branch}\n`;
    report += `Commit: ${pipeline.commit}\n`;
    report += `Status: ${this.getStatusEmoji(pipeline.status)} ${pipeline.status.toUpperCase()}\n`;
    report += `Início: ${pipeline.startTime.toLocaleString('pt-BR')}\n`;
    if (pipeline.endTime) {
      report += `Término: ${pipeline.endTime.toLocaleString('pt-BR')}\n`;
      report += `Duração: ${duration.toFixed(2)}s\n`;
    }

    report += '\nESTÁGIOS:\n';
    report += '-'.repeat(70) + '\n';

    pipeline.stages.forEach((stage) => {
      const emoji = this.getStageEmoji(stage.status);
      report += `${emoji} ${stage.name.padEnd(20)} [${stage.status.toUpperCase()}]`;

      if (stage.duration) {
        report += ` (${(stage.duration / 1000).toFixed(2)}s)`;
      }

      if (stage.error) {
        report += `\n   ❌ Erro: ${stage.error}`;
      }

      report += '\n';
    });

    return report;
  }

  /**
   * Gerar relatório geral de CI/CD
   */
  generateCIDashboard(): string {
    const lastBuild = this.buildHistory[this.buildHistory.length - 1];
    const lastTest = this.testHistory[this.testHistory.length - 1];
    const lastSecurity = this.securityHistory[this.securityHistory.length - 1];

    const successfulBuilds = this.buildHistory.filter((b) => b.success).length;
    const buildSuccessRate = this.buildHistory.length > 0 
      ? ((successfulBuilds / this.buildHistory.length) * 100).toFixed(1)
      : 'N/A';

    let report = '📊 CI/CD DASHBOARD\n';
    report += '='.repeat(70) + '\n\n';

    // Último Build
    report += 'ÚLTIMO BUILD:\n';
    report += '-'.repeat(70) + '\n';
    if (lastBuild) {
      report += `Status: ${lastBuild.success ? '✅ Sucesso' : '❌ Falha'}\n`;
      report += `Data: ${lastBuild.timestamp.toLocaleString('pt-BR')}\n`;
      report += `Duração: ${(lastBuild.duration / 1000).toFixed(2)}s\n`;
      report += `Versão: ${lastBuild.version}\n`;
      if (lastBuild.errors.length > 0) {
        report += `Erros: ${lastBuild.errors.length}\n`;
      }
      if (lastBuild.warnings.length > 0) {
        report += `Avisos: ${lastBuild.warnings.length}\n`;
      }
    } else {
      report += 'Nenhum build registrado\n';
    }

    // Último Teste
    report += '\nÚLTIMO TESTE:\n';
    report += '-'.repeat(70) + '\n';
    if (lastTest) {
      report += `Total: ${lastTest.total}\n`;
      report += `✅ Passou: ${lastTest.passed}\n`;
      report += `❌ Falhou: ${lastTest.failed}\n`;
      report += `⏭️  Pulado: ${lastTest.skipped}\n`;
      report += `Duração: ${(lastTest.duration / 1000).toFixed(2)}s\n`;
    } else {
      report += 'Nenhum teste registrado\n';
    }

    // Última Verificação de Segurança
    report += '\nÚLTIMA VERIFICAÇÃO DE SEGURANÇA:\n';
    report += '-'.repeat(70) + '\n';
    if (lastSecurity) {
      report += `Status: ${lastSecurity.passed ? '✅ Passou' : '❌ Falhou'}\n`;
      report += `Vulnerabilidades Críticas: ${lastSecurity.vulnerabilities.critical}\n`;
      report += `Vulnerabilidades Altas: ${lastSecurity.vulnerabilities.high}\n`;
      report += `Vulnerabilidades Médias: ${lastSecurity.vulnerabilities.medium}\n`;
      report += `Vulnerabilidades Baixas: ${lastSecurity.vulnerabilities.low}\n`;
    } else {
      report += 'Nenhuma verificação registrada\n';
    }

    // Estatísticas
    report += '\nESTATÍSTICAS:\n';
    report += '-'.repeat(70) + '\n';
    report += `Total de Builds: ${this.buildHistory.length}\n`;
    report += `Taxa de Sucesso: ${buildSuccessRate}%\n`;
    report += `Total de Testes: ${this.testHistory.length}\n`;
    report += `Verificações de Segurança: ${this.securityHistory.length}\n`;

    return report;
  }

  /**
   * Auxiliar: emoji do status
   */
  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      pending: '⏳',
      running: '🔄',
      success: '✅',
      failed: '❌',
      skipped: '⏭️',
    };
    return emojis[status] || '❓';
  }

  /**
   * Auxiliar: emoji do estágio
   */
  private getStageEmoji(status: string): string {
    return this.getStatusEmoji(status);
  }

  /**
   * Gerar ID único para pipeline
   */
  private generatePipelineId(): string {
    return `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpar histórico (útil para testes)
   */
  clearHistory(): void {
    this.buildHistory = [];
    this.testHistory = [];
    this.securityHistory = [];
    this.pipelines.clear();
    this.currentPipeline = null;
  }
}

export default CIPipelineService.getInstance();
