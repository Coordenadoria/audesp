/**
 * errorDiagnosticsService.ts
 * 
 * Serviço para diagnóstico automático de erros de transmissão
 * Analisa respostas da API e fornece sugestões de correção
 */

export interface ErrorDiagnostic {
  code: string;
  type: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  cause: string;
  solution: string;
  examples?: {
    wrong: any;
    correct: any;
  };
  affectedField?: string;
  suggestion?: string;
}

export interface TransmissionError {
  status: number;
  error: string;
  message: any;
  timestamp?: string;
  path?: string;
}

export class ErrorDiagnosticsService {
  /**
   * Analisa erro de transmissão e fornece diagnóstico
   */
  static diagnoseError(error: TransmissionError | any): ErrorDiagnostic[] {
    const diagnostics: ErrorDiagnostic[] = [];

    // Handle 400 Bad Request - Schema Validation
    if (error.status === 400) {
      if (error.message?.mensagem?.includes('Schema')) {
        diagnostics.push(...this.analyzeSchemaErrors(error));
      }
    }

    // Handle 401 Unauthorized
    if (error.status === 401) {
      diagnostics.push(this.createDiagnostic(
        'AUTH_401',
        'Autenticação',
        'error',
        'Credencial fornecida não é válida',
        'CPF/Email ou senha incorretos, ou usuário sem permissão',
        'Verifique CPF/Email e senha. Se corretos, usuário pode não ter permissão no Audesp. Clique "Fazer Login Novamente" para tentar outro usuário.',
        'erro_401'
      ));
    }

    // Handle 403 Forbidden
    if (error.status === 403) {
      diagnostics.push(this.createDiagnostic(
        'PERM_403',
        'Permissão',
        'error',
        'Acesso negado - O usuário não possui autorização',
        'Você tentou acessar um recurso para o qual não tem permissão. Possíveis causas:\n\n' +
        '1. CPF/Email sem permissão para transmitir este tipo de documento\n' +
        '2. Credencial não reconhecida como validada no Audesp\n' +
        '3. Acesso revogado ou suspenso\n' +
        '4. Ambiente (Piloto vs Produção) pode ter permissões diferentes',
        'AÇÕES RECOMENDADAS:\n\n' +
        '1. Clique "Fazer Login Novamente" e use outro CPF/Email autorizado\n' +
        '2. Verifique com administrador Audesp se sua credencial está ativa\n' +
        '3. Se está usando Piloto, tente no ambiente Produção\n' +
        '4. Contate: suporte@audesp.tce.sp.gov.br com seu CPF/Email',
        'erro_403'
      ));
    }

    // Handle 404 Not Found
    if (error.status === 404) {
      diagnostics.push(this.createDiagnostic(
        'NOT_FOUND_404',
        'Recurso',
        'error',
        'Recurso não encontrado',
        'Endpoint ou recurso não existe',
        'Verifique se está usando ambiente correto (Piloto vs Produção).',
        'erro_404'
      ));
    }

    // Handle 500 Server Error
    if (error.status >= 500) {
      diagnostics.push(this.createDiagnostic(
        'SERVER_ERROR_500',
        'Servidor',
        'critical',
        'Erro interno do servidor Audesp',
        'Servidor Audesp está com problema',
        'Tente novamente em alguns minutos. Se persistir, contate suporte.',
        'erro_500'
      ));
    }

    // Handle network errors
    if (!error.status) {
      diagnostics.push(this.createDiagnostic(
        'NETWORK_ERR',
        'Rede',
        'critical',
        'Falha de conexão',
        'Não conseguiu conectar ao servidor Audesp',
        'Verifique sua conexão com internet. Se problema persistir, contate suporte.',
        'erro_rede'
      ));
    }

    return diagnostics.length > 0 ? diagnostics : [this.createUnknownError()];
  }

  /**
   * Analisa erros de validação de schema
   */
  private static analyzeSchemaErrors(error: TransmissionError): ErrorDiagnostic[] {
    const diagnostics: ErrorDiagnostic[] = [];
    const errors = error.message?.erros || [];

    for (const err of errors) {
      if (typeof err !== 'string') continue;

      // Análise de campo não definido
      if (err.includes('is not defined in the schema')) {
        const fieldMatch = err.match(/\$\.([\w.\[\]]+):/);
        const field = fieldMatch?.[1] || 'desconhecido';

        diagnostics.push(this.createDiagnostic(
          'SCHEMA_UNDEFINED',
          'Validação Schema',
          'error',
          `Campo "${field}" não é definido no schema`,
          'Seu JSON contém um campo que não é permitido pelo Audesp',
          `Remova o campo "${field}" do seu JSON e tente novamente.`,
          field
        ));
      }

      // Análise de excesso de propriedades
      if (err.includes('may only have a maximum of')) {
        const fieldMatch = err.match(/\$\.([\w.\[\]]+):/);
        const field = fieldMatch?.[1] || 'desconhecido';
        const maxMatch = err.match(/maximum of (\d+)/);
        const maxProps = maxMatch?.[1] || '?';

        diagnostics.push(this.createDiagnostic(
          'SCHEMA_MAX_PROPS',
          'Validação Schema',
          'error',
          `Objeto "${field}" tem muitas propriedades`,
          `Este objeto pode ter no máximo ${maxProps} propriedade(s), mas você enviou mais.`,
          `Verifique o objeto "${field}" e remova propriedades extras, deixando apenas as obrigatórias.`,
          field
        ));
      }

      // Análise de campo obrigatório
      if (err.includes('is required')) {
        const fieldMatch = err.match(/\$\.([\w.\[\]]+):/);
        const field = fieldMatch?.[1] || 'desconhecido';

        diagnostics.push(this.createDiagnostic(
          'SCHEMA_REQUIRED',
          'Validação Schema',
          'error',
          `Campo obrigatório "${field}" não foi fornecido`,
          'Este campo é necessário para validação',
          `Adicione o campo "${field}" ao seu JSON com um valor válido.`,
          field
        ));
      }

      // Análise de formato inválido
      if (err.includes('does not conform to the specified format')) {
        const fieldMatch = err.match(/\$\.([\w.\[\]]+):/);
        const field = fieldMatch?.[1] || 'desconhecido';

        diagnostics.push(this.createDiagnostic(
          'SCHEMA_FORMAT',
          'Validação Schema',
          'error',
          `Campo "${field}" tem formato inválido`,
          'Valor não está no formato esperado pelo schema',
          `Verifique o formato do campo "${field}". Pode ser data (DD/MM/YYYY), número com decimais, etc.`,
          field
        ));
      }
    }

    return diagnostics;
  }

  /**
   * Cria objeto de diagnóstico
   */
  private static createDiagnostic(
    code: string,
    type: string,
    severity: 'critical' | 'error' | 'warning' | 'info',
    message: string,
    cause: string,
    solution: string,
    field?: string,
    suggestion?: string
  ): ErrorDiagnostic {
    return {
      code,
      type,
      severity,
      message,
      cause,
      solution,
      affectedField: field,
      suggestion
    };
  }

  /**
   * Cria diagnóstico para erro desconhecido
   */
  private static createUnknownError(): ErrorDiagnostic {
    return {
      code: 'UNKNOWN_ERROR',
      type: 'Desconhecido',
      severity: 'warning',
      message: 'Erro desconhecido durante transmissão',
      cause: 'Não foi possível identificar a causa exata do erro',
      solution: 'Verifique o console do navegador (F12) para mais detalhes. Se o problema persistir, contate suporte.'
    };
  }

  /**
   * Gera sugestões de correção automática para o JSON
   */
  static suggestFixesForJSON(json: any, diagnostics: ErrorDiagnostic[]): any {
    let corrected = JSON.parse(JSON.stringify(json)); // Deep copy

    for (const diag of diagnostics) {
      if (!diag.affectedField) continue;

      // Para erros de campo não definido
      if (diag.code === 'SCHEMA_UNDEFINED') {
        corrected = this.removeField(corrected, diag.affectedField);
      }

      // Para erros de muitas propriedades
      if (diag.code === 'SCHEMA_MAX_PROPS') {
        corrected = this.limitProperties(corrected, diag.affectedField, 2);
      }
    }

    return corrected;
  }

  /**
   * Remove campo do JSON seguindo path como "pagamentos[0].campo"
   */
  private static removeField(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);

      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key]?.[parseInt(index)];
      } else {
        current = current[part];
      }

      if (!current) return obj;
    }

    const lastPart = parts[parts.length - 1];
    delete current[lastPart];

    return obj;
  }

  /**
   * Limita número de propriedades em um objeto
   */
  private static limitProperties(obj: any, path: string, maxProps: number): any {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);

      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key]?.[parseInt(index)];
      } else {
        current = current[part];
      }

      if (!current) return obj;
    }

    if (typeof current === 'object' && !Array.isArray(current)) {
      const keys = Object.keys(current);
      if (keys.length > maxProps) {
        const toDelete = keys.slice(maxProps);
        toDelete.forEach(key => delete current[key]);
      }
    }

    return obj;
  }

  /**
   * Formata diagnóstico para exibição ao usuário
   */
  static formatDiagnosticForDisplay(diag: ErrorDiagnostic): string {
    let output = `\n${'='.repeat(60)}\n`;
    output += `🔴 ${diag.type}\n`;
    output += `${'='.repeat(60)}\n\n`;

    output += `📌 Problema:\n${diag.message}\n\n`;
    output += `🔍 Por quê:\n${diag.cause}\n\n`;
    output += `✅ Solução:\n${diag.solution}\n\n`;

    if (diag.affectedField) {
      output += `📍 Campo afetado: ${diag.affectedField}\n\n`;
    }

    output += `${'='.repeat(60)}\n`;

    return output;
  }

  /**
   * Formata múltiplos diagnósticos para exibição
   */
  static formatDiagnosticsForDisplay(diagnostics: ErrorDiagnostic[]): string {
    let output = '\n\n';
    output += '╔════════════════════════════════════════════════════════════╗\n';
    output += '║         DIAGNÓSTICO DE ERROS DE TRANSMISSÃO                ║\n';
    output += '╚════════════════════════════════════════════════════════════╝\n\n';

    // Agrupa por severidade
    const bySeverity = {
      critical: diagnostics.filter(d => d.severity === 'critical'),
      error: diagnostics.filter(d => d.severity === 'error'),
      warning: diagnostics.filter(d => d.severity === 'warning'),
      info: diagnostics.filter(d => d.severity === 'info')
    };

    if (bySeverity.critical.length > 0) {
      output += '🔴 CRÍTICO:\n';
      bySeverity.critical.forEach(d => {
        output += `  • ${d.message}\n`;
        output += `    → ${d.solution}\n\n`;
      });
    }

    if (bySeverity.error.length > 0) {
      output += '❌ ERROS:\n';
      bySeverity.error.forEach(d => {
        output += `  • ${d.message}\n`;
        output += `    → ${d.solution}\n\n`;
      });
    }

    if (bySeverity.warning.length > 0) {
      output += '⚠️  AVISOS:\n';
      bySeverity.warning.forEach(d => {
        output += `  • ${d.message}\n\n`;
      });
    }

    return output;
  }
}

export default ErrorDiagnosticsService;
