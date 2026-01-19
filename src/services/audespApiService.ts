/**
 * SERVIÇO DE API COMPLETO - AUDESP FASE IV & V
 * Implementa todas as rotas de login, consulta e envio
 */

import EnhancedAuthService from './enhancedAuthService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ConsultaResponse {
  protocolo: string;
  status: 'Recebido' | 'Armazenado' | 'Rejeitado';
  dataHora: string;
  descricao: string;
}

export interface PrestacaoContasResponse {
  protocolo: string;
  status: 'Recebido' | 'Armazenado' | 'Rejeitado';
  dataHora: string;
  erros?: string[];
  avisos?: string[];
}

export class AudespApiService {
  /**
   * AUTENTICAÇÃO
   */

  static async login(email: string, password: string) {
    return EnhancedAuthService.login({ email, password });
  }

  static logout() {
    EnhancedAuthService.logout();
  }

  /**
   * CONSULTAS GERAIS
   */

  static async consultarDocumento(protocolo: string, fase: 'f4' | 'f5') {
    const baseUrl = EnhancedAuthService.getBaseUrl();
    const url = `${baseUrl}/${fase}/consulta/${protocolo}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...EnhancedAuthService.getAuthHeader()
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data,
        status: response.status
      } as ApiResponse<ConsultaResponse>;

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: 0
      } as ApiResponse;
    }
  }

  /**
   * FASE IV - LICITAÇÕES E CONTRATOS
   */

  static async enviarEdital(editalData: any) {
    return this.enviarFase4('enviar-edital', editalData);
  }

  static async enviarLicitacao(licitacaoData: any) {
    return this.enviarFase4('enviar-licitacao', licitacaoData);
  }

  static async enviarAta(ataData: any) {
    return this.enviarFase4('enviar-ata', ataData);
  }

  static async enviarAjuste(ajusteData: any) {
    return this.enviarFase4('enviar-ajuste', ajusteData);
  }

  private static async enviarFase4(rota: string, data: any) {
    const baseUrl = EnhancedAuthService.getBaseUrl();
    const url = `${baseUrl}/recepcao-fase-4/f4/${rota}`;

    return this.enviarJSON(url, data);
  }

  /**
   * FASE V - PRESTAÇÃO DE CONTAS
   */

  static async enviarPrestacaoContasConvenio(data: any) {
    return this.enviarFase5('enviar-prestacao-contas-convenio', data);
  }

  static async enviarPrestacaoContasContratoGestao(data: any) {
    return this.enviarFase5('enviar-prestacao-contas-contrato-gestao', data);
  }

  static async enviarPrestacaoContasTermoColaboracao(data: any) {
    return this.enviarFase5('enviar-prestacao-contas-termo-colaboracao', data);
  }

  static async enviarPrestacaoContasTermoFomento(data: any) {
    return this.enviarFase5('enviar-prestacao-contas-termo-fomento', data);
  }

  static async enviarPrestacaoContasTermoParceria(data: any) {
    return this.enviarFase5('enviar-prestacao-contas-termo-parceria', data);
  }

  static async enviarDeclaraNegativa(data: any) {
    return this.enviarFase5('declaracao-negativa', data);
  }

  private static async enviarFase5(rota: string, data: any) {
    const baseUrl = EnhancedAuthService.getBaseUrl();
    const url = `${baseUrl}/f5/${rota}`;

    return this.enviarJSON(url, data);
  }

  /**
   * UTILITÁRIO: Enviar JSON para qualquer endpoint
   */

  private static async enviarJSON(url: string, data: any) {
    try {
      console.log(`[API] POST ${url}`);

      const formData = new FormData();
      const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      formData.append('documentoJSON', jsonBlob, 'data.json');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...EnhancedAuthService.getAuthHeader()
        },
        body: formData
      });

      const responseData = await response.json();

      return {
        success: response.ok,
        data: responseData,
        status: response.status
      } as ApiResponse<PrestacaoContasResponse>;

    } catch (error: any) {
      console.error('[API] Erro:', error);
      return {
        success: false,
        error: error.message,
        status: 0
      } as ApiResponse;
    }
  }

  /**
   * OBTER INFORMAÇÕES DA AUTENTICAÇÃO ATUAL
   */

  static getEnvironment() {
    return EnhancedAuthService.getEnvironment();
  }

  static setEnvironment(env: 'piloto' | 'producao') {
    EnhancedAuthService.setEnvironment(env);
  }

  static isAuthenticated() {
    return EnhancedAuthService.isAuthenticated();
  }

  static getBaseUrl() {
    return EnhancedAuthService.getBaseUrl();
  }
}

export default AudespApiService;
