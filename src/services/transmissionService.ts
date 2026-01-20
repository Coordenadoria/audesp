export interface TransmissionResponse {
  success: boolean;
  message: string;
  receipt?: string;
  errors?: string[];
  timestamp: string;
}

export const sendPrestacaoContas = async (data: any, credentials: {
  cpf: string;
  password: string;
  environment: 'piloto' | 'producao';
}): Promise<TransmissionResponse> => {
  try {
    if (!data.descritor?.municipio) {
      return {
        success: false,
        message: 'Descritor incompleto',
        errors: ['Município não informado'],
        timestamp: new Date().toISOString()
      };
    }

    if (!data.documentos_fiscais || data.documentos_fiscais.length === 0) {
      return {
        success: false,
        message: 'Nenhum documento fiscal informado',
        errors: ['Pelo menos um documento fiscal é necessário'],
        timestamp: new Date().toISOString()
      };
    }

    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return {
        success: true,
        message: 'Transmissão simulada com sucesso',
        receipt: `REC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        timestamp: new Date().toISOString()
      };
    }

    const response = await fetch('/api/audesp/transmit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${btoa(`${credentials.cpf}:${credentials.password}`)}`
      },
      body: JSON.stringify({
        data,
        environment: credentials.environment
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Erro na transmissão',
        errors: error.errors || [response.statusText],
        timestamp: new Date().toISOString()
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Transmissão realizada com sucesso',
      receipt: result.receipt,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      success: false,
      message: 'Erro ao transmitir',
      errors: [(err as Error).message],
      timestamp: new Date().toISOString()
    };
  }
};

export const checkTransmissionStatus = async (receipt: string, environment: 'piloto' | 'producao'): Promise<any> => {
  try {
    const response = await fetch(`/api/audesp/status/${receipt}?env=${environment}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status');
    }

    return await response.json();
  } catch (err) {
    throw new Error(`Erro: ${(err as Error).message}`);
  }
};

export const downloadReceipt = (receipt: string) => {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(
    `RECIBO DE TRANSMISSÃO AUDESP\n\nNúmero: ${receipt}\nData: ${new Date().toLocaleString('pt-BR')}`
  )}`);
  element.setAttribute('download', `recibo_${receipt}.txt`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
