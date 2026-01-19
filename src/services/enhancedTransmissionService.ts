/**
 * ENHANCED TRANSMISSION SERVICE v2
 * Serviço de transmissão com inteligência artificial e tratamento avançado de erros
 * 
 * Melhorias:
 * 1. Auto-detecção de problemas comuns
 * 2. Retry inteligente com backoff exponencial
 * 3. Cache de resultados
 * 4. Relatório diagnóstico detalhado
 */

import { PrestacaoContas, AudespResponse, TipoDocumentoDescritor } from '../types';
import { AuditLogger } from './auditService';
import { PermissionService } from './permissionService';

// ==================== TIPOS ====================

export interface TransmissionDiagnostic {
  errorCode: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'AUTH' | 'PERMISSION' | 'NETWORK' | 'VALIDATION' | 'SERVER' | 'UNKNOWN';
  primaryCause: string;
  secondaryCauses: string[];
  resolutionSteps: string[];
  suggestedRetry: boolean;
  retryDelay?: number;
}

export interface TransmissionMetrics {
  attempt: number;
  duration: number;
  statusCode?: number;
  errorType?: string;
  timestamp: string;
}

// ==================== CONFIGURAÇÃO ====================

const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000,    // 10 segundos
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504] // Timeout, RateLimit, Server errors
};

const ERROR_CATEGORIES = {
  '401': 'AUTH',
  '403': 'PERMISSION',
  'Failed to fetch': 'NETWORK',
  'NetworkError': 'NETWORK',
  'TypeError': 'VALIDATION',
  '5': 'SERVER'
} as Record<string, string>;

// ==================== CACHE ====================

class TransmissionCache {
  private cache: Map<string, { response: any; timestamp: number; ttl: number }> = new Map();
  
  set(key: string, value: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      response: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.response;
  }
  
  clear() {
    this.cache.clear();
  }
}

const cache = new TransmissionCache();

// ==================== DIAGNOSTIC ENGINE ====================

export class DiagnosticEngine {
  static analyze(error: any, statusCode?: number, tipoDoc?: string): TransmissionDiagnostic {
    const errorCode = `TRANS-${statusCode || 'UNK'}-${Date.now().toString().slice(-6)}`;
    const errorMessage = error?.message || '';
    
    // Categorizar erro
    let category: 'AUTH' | 'PERMISSION' | 'NETWORK' | 'VALIDATION' | 'SERVER' | 'UNKNOWN' = 'UNKNOWN';
    for (const [key, cat] of Object.entries(ERROR_CATEGORIES)) {
      if (statusCode?.toString().startsWith(key) || errorMessage.includes(key)) {
        category = cat as any;
        break;
      }
    }
    
    // Gerar diagnóstico baseado na categoria
    switch (category) {
      case 'AUTH':
        return this.diagnoseAuth(errorCode, errorMessage);
      case 'PERMISSION':
        return this.diagnosePermission(errorCode, tipoDoc);
      case 'NETWORK':
        return this.diagnoseNetwork(errorCode, errorMessage);
      case 'VALIDATION':
        return this.diagnoseValidation(errorCode);
      case 'SERVER':
        return this.diagnoseServer(errorCode, statusCode);
      default:
        return this.diagnoseUnknown(errorCode, errorMessage);
    }
  }
  
  private static diagnoseAuth(errorCode: string, message: string): TransmissionDiagnostic {
    return {
      errorCode,
      severity: 'CRITICAL',
      category: 'AUTH',
      primaryCause: 'Falha de autenticação - Token inválido ou expirado',
      secondaryCauses: [
        'Token JWT expirou durante a sessão',
        'Usuário foi desconectado no servidor',
        'Credenciais foram revogadas',
        'Tentativa de acesso sem token'
      ],
      resolutionSteps: [
        '1. Clique em "Sair" para fazer logout',
        '2. Faça login novamente com suas credenciais',
        '3. Se usar email, verifique se é o email correto',
        '4. Tente novamente imediatamente após login',
        '5. Se persistir, tente em modo incógnito/privado'
      ],
      suggestedRetry: false
    };
  }
  
  private static diagnosePermission(errorCode: string, tipoDoc?: string): TransmissionDiagnostic {
    return {
      errorCode,
      severity: 'ERROR',
      category: 'PERMISSION',
      primaryCause: `Você não tem permissão para transmitir ${tipoDoc || 'este tipo de documento'}`,
      secondaryCauses: [
        'CPF/Email não está autorizado no Audesp',
        'Permissão foi revogada temporariamente',
        'Perfil não inclui este tipo de transmissão',
        'Ambiente Piloto pode ter permissões diferentes'
      ],
      resolutionSteps: [
        '1. Confirme com seu administrador que sua CPF está ativa',
        '2. Tente com outra CPF que você sabe ter acesso',
        '3. Se usar email, peça ao admin para validar sua identidade',
        '4. Contate Audesp: suporte@audesp.tce.sp.gov.br',
        '5. Compartilhe este código com o suporte: ' + errorCode
      ],
      suggestedRetry: false
    };
  }
  
  private static diagnoseNetwork(errorCode: string, message: string): TransmissionDiagnostic {
    return {
      errorCode,
      severity: 'WARNING',
      category: 'NETWORK',
      primaryCause: 'Erro de conexão com o servidor Audesp',
      secondaryCauses: [
        'Servidor Audesp pode estar temporariamente indisponível',
        'Seu navegador bloqueou a requisição por CORS',
        'Internet pode estar lenta ou desconectada',
        'Firewall/proxy pode estar bloqueando',
        'Servidor DNS pode estar fora do ar'
      ],
      resolutionSteps: [
        '1. Verifique sua conexão de internet',
        '2. Tente acessar https://audesp-piloto.tce.sp.gov.br no navegador',
        '3. Se não conseguir, o servidor está indisponível - tente mais tarde',
        '4. Se conseguir acessar, tente fazer logout e login novamente',
        '5. Se usar VPN, tente desabilitar temporariamente'
      ],
      suggestedRetry: true,
      retryDelay: 5000
    };
  }
  
  private static diagnoseValidation(errorCode: string): TransmissionDiagnostic {
    return {
      errorCode,
      severity: 'ERROR',
      category: 'VALIDATION',
      primaryCause: 'Dados inválidos na transmissão',
      secondaryCauses: [
        'Formato do JSON não está correto',
        'Campos obrigatórios estão faltando',
        'Tipo de dado incompatível',
        'Caracteres especiais podem estar causando problemas'
      ],
      resolutionSteps: [
        '1. Verifique se todos os campos estão preenchidos corretamente',
        '2. Certifique-se que datas estão no formato DD/MM/YYYY',
        '3. Números devem usar ponto (.) como separador decimal',
        '4. Evite copiar/colar de outros aplicativos (pode ter formatação oculta)',
        '5. Tente recarregar a página (F5) e preencher novamente'
      ],
      suggestedRetry: false
    };
  }
  
  private static diagnoseServer(errorCode: string, statusCode?: number): TransmissionDiagnostic {
    return {
      errorCode,
      severity: 'WARNING',
      category: 'SERVER',
      primaryCause: `Erro no servidor Audesp (HTTP ${statusCode})`,
      secondaryCauses: [
        'Servidor está sobrecarregado',
        'Manutenção em progresso',
        'Erro interno do servidor',
        'Banco de dados indisponível'
      ],
      resolutionSteps: [
        '1. Aguarde alguns minutos e tente novamente',
        '2. Se estiver em horário de pico, tente em outro horário',
        '3. Verifique o status em https://audesp-piloto.tce.sp.gov.br',
        '4. Se o erro persistir por mais de 1 hora, contate suporte',
        '5. Compartilhe este código: ' + errorCode
      ],
      suggestedRetry: true,
      retryDelay: 10000
    };
  }
  
  private static diagnoseUnknown(errorCode: string, message: string): TransmissionDiagnostic {
    return {
      errorCode,
      severity: 'WARNING',
      category: 'UNKNOWN',
      primaryCause: `Erro desconhecido: ${message}`,
      secondaryCauses: [
        'Pode ser um erro raro ou de transição',
        'Navegador pode estar em estado inconsistente',
        'Extensão de navegador pode estar interferindo'
      ],
      resolutionSteps: [
        '1. Tente fazer logout e login novamente',
        '2. Recarregue a página (Ctrl+F5)',
        '3. Tente em outro navegador',
        '4. Tente em modo incógnito/privado',
        '5. Se persistir, contate suporte com este código: ' + errorCode
      ],
      suggestedRetry: true,
      retryDelay: 3000
    };
  }
}

// ==================== RETRY LOGIC ====================

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = RETRY_CONFIG.maxAttempts
): Promise<{ result?: T; error?: any; attempts: TransmissionMetrics[] }> {
  const metrics: TransmissionMetrics[] = [];
  let lastError: any;
  let delay = RETRY_CONFIG.initialDelay;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      metrics.push({
        attempt,
        duration: Date.now() - startTime,
        statusCode: 200,
        timestamp: new Date().toISOString()
      });
      
      return { result, attempts: metrics };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      metrics.push({
        attempt,
        duration,
        errorType: error.name || 'Unknown',
        timestamp: new Date().toISOString()
      });
      
      lastError = error;
      
      // Se ainda há tentativas restantes e não é o último erro
      if (attempt < maxAttempts) {
        // Só faz retry para erros específicos
        const shouldRetry = 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('timeout');
        
        if (shouldRetry) {
          console.log(`[Transmission] Tentativa ${attempt} falhou. Aguardando ${delay}ms antes de retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay);
        } else {
          break; // Erro não-recuperável
        }
      }
    }
  }
  
  return { error: lastError, attempts: metrics };
}

// ==================== MAIN TRANSMISSION FUNCTION ====================

export async function sendPrestacaoContasEnhanced(
  token: string,
  data: PrestacaoContas,
  cpf?: string
): Promise<{ response: AudespResponse; diagnostic?: TransmissionDiagnostic; metrics: TransmissionMetrics[] }> {
  const tipoDoc = data.descritor.tipo_documento;
  
  // Criar chave de cache
  const cacheKey = `transmission_${tipoDoc}_${cpf}_${JSON.stringify(data).substring(0, 50)}`;
  
  // Verificar cache
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    console.log('[Transmission] ✓ Resultado encontrado em cache (5min)');
    return cachedResult;
  }
  
  // Validar permissões
  console.log(`[Transmission] Iniciando transmissão com diagnóstico avançado para: ${tipoDoc}`);
  const permissionCheck = await PermissionService.validateTransmissionPermission(tipoDoc, token, cpf);
  
  if (!permissionCheck.hasPermission) {
    const diagnostic = DiagnosticEngine.analyze(
      new Error(permissionCheck.reason),
      403,
      tipoDoc
    );
    
    console.error('[Transmission] ❌ Validação de permissão falhou:', diagnostic);
    
    AuditLogger.logTransmission(tipoDoc, null, 'PERMISSION_DENIED', permissionCheck.reason);
    
    throw {
      diagnostic,
      message: `❌ ${diagnostic.primaryCause}\n\n${diagnostic.resolutionSteps.join('\n')}`
    };
  }
  
  // Executar com retry inteligente
  const { result, error, attempts } = await retryWithBackoff(
    () => executeTransmission(token, data, cpf)
  );
  
  if (result) {
    // Cachear resultado de sucesso
    const response = { response: result, metrics: attempts };
    cache.set(cacheKey, response, 300); // 5 minutos
    
    AuditLogger.logTransmission(tipoDoc, result.protocolo, 'SUCCESS');
    
    console.log('[Transmission] ✅ Transmissão bem-sucedida:', result);
    return response;
  }
  
  // Analisar erro com diagnóstico
  const diagnostic = DiagnosticEngine.analyze(error, undefined, tipoDoc);
  
  console.error('[Transmission] ❌ Transmissão falhou após ' + attempts.length + ' tentativas');
  console.error('[Transmission] Diagnóstico:', diagnostic);
  
  AuditLogger.logTransmission(tipoDoc, null, 'FAILED', error?.message);
  
  // Gerar mensagem amigável
  const userMessage = `❌ ${diagnostic.primaryCause}

📋 O que pode estar errado:
${diagnostic.secondaryCauses.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}

🔧 Como resolver:
${diagnostic.resolutionSteps.join('\n')}

📞 Código para suporte: ${diagnostic.errorCode}`;
  
  throw {
    diagnostic,
    message: userMessage,
    metrics: attempts
  };
}

// ==================== EXECUTION FUNCTION ====================

async function executeTransmission(
  token: string,
  data: PrestacaoContas,
  cpf?: string
): Promise<AudespResponse> {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const API_BASE = isLocalhost
    ? "/proxy-piloto-f5"
    : "https://audesp-piloto.tce.sp.gov.br/f5";
  
  const ROUTE_MAP: Record<TipoDocumentoDescritor, string> = {
    "Prestação de Contas de Convênio": "/enviar-prestacao-contas-convenio",
    "Prestação de Contas de Contrato de Gestão": "/enviar-prestacao-contas-contrato-gestao",
    "Prestação de Contas de Termo de Parceria": "/enviar-prestacao-contas-parceria",
    "Prestação de Contas de Termo de Fomento": "/enviar-prestacao-contas-termo-fomento",
    "Prestação de Contas de Termo de Colaboração": "/enviar-prestacao-contas-termo-colaboracao",
    "Declaração Negativa": "/enviar-prestacao-contas-declaracao-negativa"
  };
  
  const tipoDoc = data.descritor.tipo_documento;
  const endpoint = ROUTE_MAP[tipoDoc];
  
  if (!endpoint) {
    throw new Error(`Tipo de documento não mapeado: ${tipoDoc}`);
  }
  
  const fullUrl = `${API_BASE}${endpoint}`;
  
  // Preparar dados
  const formData = new FormData();
  const jsonString = JSON.stringify(data);
  formData.append('documentoJSON', jsonString);
  
  // Fazer requisição com timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        'Accept': 'application/json',
        ...(cpf && { 'X-User-CPF': cpf })
      },
      body: formData,
      signal: controller.signal
    });
    
    const responseText = await response.text();
    const result = JSON.parse(responseText);
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: result.message,
        details: result
      };
    }
    
    return result as AudespResponse;
  } finally {
    clearTimeout(timeout);
  }
}

// ==================== EXPORTS ====================

export function clearTransmissionCache() {
  cache.clear();
  console.log('[Transmission] Cache limpo');
}

export function getTransmissionCacheInfo() {
  return {
    size: (cache as any).cache.size,
    message: 'Cache com retry inteligente e diagnóstico avançado'
  };
}
