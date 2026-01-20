import axios, { AxiosInstance } from 'axios';

// ===== TIPOS OFICIAIS AUDESP =====

export interface AudeспAuthRequest {
  email: string;
  password: string;
}

export interface AudeспAuthResponse {
  token: string;
  expire_in: number;
  token_type: 'bearer';
}

export interface AudeспProtocolo {
  protocolo: string;
  data_hora: string;
  status: 'Recebido' | 'Processado' | 'Rejeitado';
  tipo: string;
  mensagens?: string[];
  campos_invalidos?: string[];
}

export interface AudeспEnvioResponse {
  protocolo: string;
  timestamp: string;
  mensagens: string[];
}

export interface AudeспValidacaoError {
  campo: string;
  mensagem: string;
  codigo: string;
}

// ===== CLIENTE AUDESP =====

class AudeспClient {
  private client: AxiosInstance;
  private token: string = '';
  private expireAt: number = 0;

  constructor(
    private baseUrl: string = 'https://sistemas.tce.sp.gov.br/audesp/api',
    private apiKey: string = ''
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    });
  }

  // ===== AUTENTICAÇÃO =====

  async login(email: string, password: string): Promise<AudeспAuthResponse> {
    try {
      const response = await this.client.post<AudeспAuthResponse>(
        '/login',
        { email, password },
        {
          headers: {
            'x-authorization': `${email}:${password}`
          }
        }
      );

      this.token = response.data.token;
      this.expireAt = Date.now() + (response.data.expire_in * 1000);

      // Atualizar header padrão
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

      return response.data;
    } catch (error) {
      throw new Error(`Falha na autenticação AUDESP: ${error}`);
    }
  }

  isAuthenticated(): boolean {
    return this.token !== '' && Date.now() < this.expireAt;
  }

  getToken(): string {
    return this.token;
  }

  // ===== FASE IV: LICITAÇÕES E CONTRATOS =====

  async enviarEdital(
    editalJson: any,
    pdfFile?: File
  ): Promise<AudeспEnvioResponse> {
    const formData = new FormData();
    formData.append('edital', JSON.stringify(editalJson));

    if (pdfFile) {
      formData.append('pdf', pdfFile);
    }

    return this.enviar('/recepcao-fase-4/f4/enviar-edital', formData);
  }

  async enviarLicitacao(licitacaoJson: any): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/recepcao-fase-4/f4/enviar-licitacao', licitacaoJson);
  }

  async enviarAta(ataJson: any): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/recepcao-fase-4/f4/enviar-ata', ataJson);
  }

  async enviarAjuste(ajusteJson: any): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/recepcao-fase-4/f4/enviar-ajuste', ajusteJson);
  }

  // ===== FASE V: PRESTAÇÃO DE CONTAS =====

  async enviarPrestacaoContasConvenio(
    prestacaoJson: any
  ): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/f5/enviar-prestacao-contas-convenio', prestacaoJson);
  }

  async enviarPrestacaoContasContratoGestao(
    prestacaoJson: any
  ): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/f5/enviar-prestacao-contas-contrato-gestao', prestacaoJson);
  }

  async enviarPrestacaoContasTermoColaboracao(
    prestacaoJson: any
  ): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/f5/enviar-prestacao-contas-termo-colaboracao', prestacaoJson);
  }

  async enviarPrestacaoContasTermoFomento(
    prestacaoJson: any
  ): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/f5/enviar-prestacao-contas-termo-fomento', prestacaoJson);
  }

  async enviarPrestacaoContasTermoParceria(
    prestacaoJson: any
  ): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/f5/enviar-prestacao-contas-termo-parceria', prestacaoJson);
  }

  async enviarDeclaracaoNegativa(
    declaracaoJson: any
  ): Promise<AudeспEnvioResponse> {
    return this.enviarJson('/f5/declaracao-negativa', declaracaoJson);
  }

  // ===== CONSULTA DE PROTOCOLOS =====

  async consultarProtocoloF4(protocolo: string): Promise<AudeспProtocolo> {
    return this.consultar(`/f4/consulta/${protocolo}`);
  }

  async consultarProtocoloF5(protocolo: string): Promise<AudeспProtocolo> {
    return this.consultar(`/f5/consulta/${protocolo}`);
  }

  // ===== MÉTODOS AUXILIARES PRIVADOS =====

  private async enviarJson(
    endpoint: string,
    data: any
  ): Promise<AudeспEnvioResponse> {
    return this.enviar(endpoint, data);
  }

  private async enviar(
    endpoint: string,
    data: any
  ): Promise<AudeспEnvioResponse> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await this.client.post<AudeспEnvioResponse>(
        endpoint,
        data,
        {
          headers: data instanceof FormData
            ? { 'Content-Type': 'multipart/form-data' }
            : { 'Content-Type': 'application/json' }
        }
      );

      return response.data;
    } catch (error: any) {
      const mensagem = error.response?.data?.mensagem || error.message;
      const camposInvalidos = error.response?.data?.campos_invalidos || [];

      throw new Error(JSON.stringify({
        mensagem,
        camposInvalidos,
        statusCode: error.response?.status
      }));
    }
  }

  private async consultar(endpoint: string): Promise<AudeспProtocolo> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await this.client.get<AudeспProtocolo>(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao consultar protocolo: ${error.message}`);
    }
  }
}

export default AudeспClient;
