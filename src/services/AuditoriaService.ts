export interface AuditoriaLog {
  id: string;
  timestamp: string;
  usuario: string;
  acao: string;
  secao: string;
  descricao: string;
  dados_antigos?: any;
  dados_novos?: any;
  ip?: string;
  user_agent?: string;
  status: 'sucesso' | 'erro' | 'aviso';
}

export interface RelatorioAuditoria {
  periodo_inicio: string;
  periodo_fim: string;
  total_operacoes: number;
  operacoes_por_usuario: { usuario: string; count: number }[];
  operacoes_por_tipo: { tipo: string; count: number }[];
  operacoes_com_erro: AuditoriaLog[];
}

class AuditoriaService {
  private logs: AuditoriaLog[] = [];
  private chaveStorage = 'audespec_auditoria_logs';

  constructor() {
    this.carregarLogs();
  }

  /**
   * Registrar ação
   */
  registrarAcao(
    usuario: string,
    acao: string,
    secao: string,
    descricao: string,
    dados?: {
      antigos?: any;
      novos?: any;
    },
    status: 'sucesso' | 'erro' | 'aviso' = 'sucesso'
  ): AuditoriaLog {
    const log: AuditoriaLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      usuario,
      acao,
      secao,
      descricao,
      dados_antigos: dados?.antigos,
      dados_novos: dados?.novos,
      ip: this.obterIP(),
      user_agent: navigator.userAgent,
      status
    };

    this.logs.push(log);
    this.salvarLogs();

    return log;
  }

  /**
   * Obter todos os logs
   */
  obterLogs(filtros?: {
    usuario?: string;
    secao?: string;
    acao?: string;
    dataInicio?: string;
    dataFim?: string;
  }): AuditoriaLog[] {
    let resultado = [...this.logs];

    if (filtros?.usuario) {
      resultado = resultado.filter(l => l.usuario === filtros.usuario);
    }

    if (filtros?.secao) {
      resultado = resultado.filter(l => l.secao === filtros.secao);
    }

    if (filtros?.acao) {
      resultado = resultado.filter(l => l.acao === filtros.acao);
    }

    if (filtros?.dataInicio) {
      resultado = resultado.filter(
        l => new Date(l.timestamp) >= new Date(filtros.dataInicio!)
      );
    }

    if (filtros?.dataFim) {
      resultado = resultado.filter(
        l => new Date(l.timestamp) <= new Date(filtros.dataFim!)
      );
    }

    return resultado.reverse(); // Mais recentes primeiro
  }

  /**
   * Gerar relatório de auditoria
   */
  gerarRelatorio(
    dataInicio: string,
    dataFim: string
  ): RelatorioAuditoria {
    const logsFiltrados = this.obterLogs({
      dataInicio,
      dataFim
    });

    // Agrupar por usuário
    const porUsuario = new Map<string, number>();
    const porTipo = new Map<string, number>();
    const comErro: AuditoriaLog[] = [];

    for (const log of logsFiltrados) {
      // Contar por usuário
      porUsuario.set(log.usuario, (porUsuario.get(log.usuario) || 0) + 1);

      // Contar por tipo de ação
      porTipo.set(log.acao, (porTipo.get(log.acao) || 0) + 1);

      // Registrar erros
      if (log.status === 'erro') {
        comErro.push(log);
      }
    }

    return {
      periodo_inicio: dataInicio,
      periodo_fim: dataFim,
      total_operacoes: logsFiltrados.length,
      operacoes_por_usuario: Array.from(porUsuario.entries()).map(([usuario, count]) => ({
        usuario,
        count
      })),
      operacoes_por_tipo: Array.from(porTipo.entries()).map(([tipo, count]) => ({
        tipo,
        count
      })),
      operacoes_com_erro: comErro
    };
  }

  /**
   * Exportar logs como CSV
   */
  exportarCSV(logs: AuditoriaLog[] = this.logs): string {
    const headers = [
      'ID',
      'Timestamp',
      'Usuário',
      'Ação',
      'Seção',
      'Descrição',
      'Status',
      'IP',
      'User Agent'
    ];

    const linhas = [headers.join(',')];

    for (const log of logs) {
      const linha = [
        log.id,
        log.timestamp,
        log.usuario,
        log.acao,
        log.secao,
        this.escaparCSV(log.descricao),
        log.status,
        log.ip || '',
        this.escaparCSV(log.user_agent || '')
      ];
      linhas.push(linha.join(','));
    }

    return linhas.join('\n');
  }

  /**
   * Exportar logs como JSON
   */
  exportarJSON(logs: AuditoriaLog[] = this.logs): string {
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Limpar logs antigos (mais de N dias)
   */
  limparLogsAntigos(dias: number = 90): number {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const tamanhoAntes = this.logs.length;
    this.logs = this.logs.filter(
      log => new Date(log.timestamp) > dataLimite
    );

    const removidos = tamanhoAntes - this.logs.length;

    if (removidos > 0) {
      this.salvarLogs();
    }

    return removidos;
  }

  /**
   * Métodos privados
   */

  private obterIP(): string {
    // Em produção, seria obtido do servidor
    return 'LOCAL';
  }

  private escaparCSV(valor: string): string {
    if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
      return `"${valor.replace(/"/g, '""')}"`;
    }
    return valor;
  }

  private salvarLogs(): void {
    try {
      localStorage.setItem(
        this.chaveStorage,
        JSON.stringify(this.logs.slice(-1000)) // Manter últimos 1000 logs
      );
    } catch (error) {
      console.error('Erro ao salvar logs:', error);
    }
  }

  private carregarLogs(): void {
    try {
      const dados = localStorage.getItem(this.chaveStorage);
      if (dados) {
        this.logs = JSON.parse(dados);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      this.logs = [];
    }
  }
}

export default new AuditoriaService();
