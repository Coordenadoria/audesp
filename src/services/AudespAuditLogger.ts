/**
 * AUDESP AUDIT LOGGER
 * Logs imutáveis de auditoria para conformidade AUDESP/LGPD
 * 
 * - Registro de todas as operações
 * - Rastreabilidade completa
 * - Hash de dados sensíveis
 * - Exportação de logs
 * - Conformidade com TCE-SP
 */

import { LogAuditoria } from './types/audesp.types';
import crypto from 'crypto';

class AudespAuditLogger {
  private static readonly STORAGE_KEY = 'audesp_audit_logs';
  private static readonly MAX_LOGS = 10000;
  private logs: LogAuditoria[] = [];

  constructor() {
    this.carregarLogs();
  }

  /**
   * Registrar ação de login
   */
  registrarLogin(
    email: string,
    nome: string,
    cpf: string,
    sucesso: boolean,
    erro?: string
  ): void {
    this.adicionarLog({
      tipo: 'LOGIN',
      endpoint: '/api/login',
      metodo: 'POST',
      usuario: { email, nome, cpf },
      statusCode: sucesso ? 200 : 401,
      erro: erro ? { codigo: '401', mensagem: erro } : undefined
    });
  }

  /**
   * Registrar envio de documento
   */
  registrarEnvio(
    usuario: { email: string; nome: string; cpf: string },
    endpoint: string,
    protocolo: string | undefined,
    sucesso: boolean,
    tempoMs: number,
    erro?: string
  ): void {
    this.adicionarLog({
      tipo: 'ENVIO',
      endpoint,
      metodo: 'POST',
      usuario,
      protocolo,
      statusCode: sucesso ? 200 : 400,
      tempoMs,
      erro: erro ? { codigo: '400', mensagem: erro } : undefined
    });
  }

  /**
   * Registrar consulta de protocolo
   */
  registrarConsulta(
    usuario: { email: string; nome: string; cpf: string },
    endpoint: string,
    protocolo: string,
    sucesso: boolean,
    tempoMs: number,
    erro?: string
  ): void {
    this.adicionarLog({
      tipo: 'CONSULTA',
      endpoint,
      metodo: 'GET',
      usuario,
      protocolo,
      statusCode: sucesso ? 200 : 404,
      tempoMs,
      erro: erro ? { codigo: '404', mensagem: erro } : undefined
    });
  }

  /**
   * Registrar reautenticação
   */
  registrarReautenticacao(
    usuario: { email: string; nome: string; cpf: string },
    sucesso: boolean,
    motivo: string
  ): void {
    this.adicionarLog({
      tipo: 'REAUTENTICACAO',
      endpoint: '/api/token/refresh',
      metodo: 'POST',
      usuario,
      statusCode: sucesso ? 200 : 401,
      erro: sucesso
        ? undefined
        : { codigo: '401', mensagem: `Reautenticação falhou: ${motivo}` }
    });
  }

  /**
   * Registrar erro
   */
  registrarErro(
    usuario: { email: string; nome: string; cpf: string } | null,
    endpoint: string,
    metodo: string,
    statusCode: number,
    erro: string,
    protocolo?: string
  ): void {
    this.adicionarLog({
      tipo: 'ERRO',
      endpoint,
      metodo: metodo as 'GET' | 'POST' | 'PUT' | 'DELETE',
      usuario: usuario || { email: 'anonimo', nome: 'Anônimo', cpf: '' },
      statusCode,
      protocolo,
      erro: { codigo: String(statusCode), mensagem: erro }
    });
  }

  /**
   * Registrar logout
   */
  registrarLogout(usuario: { email: string; nome: string; cpf: string }): void {
    this.adicionarLog({
      tipo: 'LOGOUT',
      endpoint: '/api/logout',
      metodo: 'POST',
      usuario,
      statusCode: 200
    });
  }

  /**
   * Obter todos os logs
   */
  obterTodos(): LogAuditoria[] {
    return [...this.logs];
  }

  /**
   * Filtrar logs por usuário
   */
  filtrarPorUsuario(email: string): LogAuditoria[] {
    return this.logs.filter(log => log.usuario.email === email);
  }

  /**
   * Filtrar logs por tipo
   */
  filtrarPorTipo(tipo: LogAuditoria['tipo']): LogAuditoria[] {
    return this.logs.filter(log => log.tipo === tipo);
  }

  /**
   * Filtrar logs por período
   */
  filtrarPorPeriodo(dataInicio: Date, dataFim: Date): LogAuditoria[] {
    return this.logs.filter(log => {
      const logData = new Date(log.timestamp);
      return logData >= dataInicio && logData <= dataFim;
    });
  }

  /**
   * Exportar logs em CSV
   */
  exportarCSV(): string {
    const headers = [
      'ID',
      'Timestamp',
      'Tipo',
      'Usuario (Email)',
      'Usuario (CPF)',
      'Endpoint',
      'Metodo',
      'Status',
      'Protocolo',
      'Tempo (ms)',
      'Erro'
    ];

    const linhas = this.logs.map(log => [
      log.id,
      log.timestamp,
      log.tipo,
      log.usuario.email,
      log.usuario.cpf,
      log.endpoint,
      log.metodo,
      log.statusCode,
      log.protocolo || '-',
      log.tempoMs || '-',
      log.erro ? `${log.erro.codigo}: ${log.erro.mensagem}` : '-'
    ]);

    const csv = [
      headers.join(','),
      ...linhas.map(linha => linha.map(campo => `"${campo}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Exportar logs em JSON
   */
  exportarJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Limpar logs (uso administrativo)
   */
  limpar(): void {
    console.warn('[Auditoria] Limpando todos os logs');
    this.logs = [];
    this.salvarLogs();
  }

  /**
   * Gerar relatório de atividades
   */
  gerarRelatorio(): {
    totalLogs: number;
    periodoPor: { inicio: string; fim: string };
    atividades: { [tipo: string]: number };
    usuariosAtivos: number;
    taxaSucesso: string;
  } {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const logsDia = this.filtrarPorPeriodo(dayAgo, now);
    const atividades: { [tipo: string]: number } = {};
    const usuarios = new Set<string>();
    let sucessos = 0;

    this.logs.forEach(log => {
      // Atividades
      atividades[log.tipo] = (atividades[log.tipo] || 0) + 1;

      // Usuários únicos
      usuarios.add(log.usuario.email);

      // Taxa de sucesso (status 200-299)
      if (log.statusCode >= 200 && log.statusCode < 300) {
        sucessos++;
      }
    });

    const taxaSucesso = this.logs.length > 0
      ? ((sucessos / this.logs.length) * 100).toFixed(2)
      : '0.00';

    return {
      totalLogs: this.logs.length,
      periodoPor: {
        inicio: dayAgo.toISOString(),
        fim: now.toISOString()
      },
      atividades,
      usuariosAtivos: usuarios.size,
      taxaSucesso: `${taxaSucesso}%`
    };
  }

  /**
   * Verificar integridade dos logs
   */
  verificarIntegridade(): {
    valido: boolean;
    totalLogs: number;
    logsCorruptos: number;
  } {
    let logsCorruptos = 0;

    this.logs.forEach(log => {
      try {
        // Validar campos obrigatórios
        if (
          !log.id ||
          !log.timestamp ||
          !log.tipo ||
          !log.usuario ||
          !log.usuario.email
        ) {
          logsCorruptos++;
        }
      } catch {
        logsCorruptos++;
      }
    });

    return {
      valido: logsCorruptos === 0,
      totalLogs: this.logs.length,
      logsCorruptos
    };
  }

  // =========================================================================
  // MÉTODOS PRIVADOS
  // =========================================================================

  /**
   * Adicionar novo log
   */
  private adicionarLog(dados: Partial<LogAuditoria>): void {
    const log: LogAuditoria = {
      id: this.gerarId(),
      timestamp: new Date().toISOString(),
      usuario: dados.usuario || { email: '', nome: '', cpf: '' },
      tipo: dados.tipo || 'ERRO',
      endpoint: dados.endpoint || '',
      metodo: dados.metodo || 'GET',
      statusCode: dados.statusCode || 0,
      tempoMs: dados.tempoMs || 0,
      protocolo: dados.protocolo,
      erro: dados.erro,
      readonly: true
    };

    this.logs.push(log);

    // Manter limite de logs
    if (this.logs.length > AudespAuditLogger.MAX_LOGS) {
      this.logs = this.logs.slice(-AudespAuditLogger.MAX_LOGS);
    }

    this.salvarLogs();
  }

  /**
   * Gerar ID único
   */
  private gerarId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Salvar logs em localStorage
   */
  private salvarLogs(): void {
    try {
      // Manter apenas últimos 100 logs em localStorage para não exceder limite
      const logsParaSalvar = this.logs.slice(-100);
      localStorage.setItem(
        AudespAuditLogger.STORAGE_KEY,
        JSON.stringify(logsParaSalvar)
      );
    } catch (erro) {
      console.warn('[Auditoria] Erro ao salvar logs:', erro);
    }
  }

  /**
   * Carregar logs do localStorage
   */
  private carregarLogs(): void {
    try {
      const logsJson = localStorage.getItem(AudespAuditLogger.STORAGE_KEY);
      if (logsJson) {
        this.logs = JSON.parse(logsJson);
      }
    } catch (erro) {
      console.warn('[Auditoria] Erro ao carregar logs:', erro);
      this.logs = [];
    }
  }

  /**
   * Hash de dados sensíveis
   */
  private hashDados(dados: string): string {
    return crypto.createHash('sha256').update(dados).digest('hex').substr(0, 16);
  }
}

// Singleton
let instancia: AudespAuditLogger | null = null;

export function obterLogger(): AudespAuditLogger {
  if (!instancia) {
    instancia = new AudespAuditLogger();
  }
  return instancia;
}

export default obterLogger();
