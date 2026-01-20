/**
 * EXEMPLOS DE USO - AUDESP API SERVICE V2
 * Casos de uso reais para integração com AUDESP TCE-SP
 */

import AudespApiServiceV2 from './AudespApiServiceV2';
import { CredenciaisAudesp, AmbienteAudesp } from './types/audesp.types';

// ============================================================================
// EXEMPLO 1: INICIALIZAR E FAZER LOGIN
// ============================================================================

export async function exemplo1_LoginInicial() {
  console.log('========== EXEMPLO 1: LOGIN INICIAL ==========');

  // Configurar ambiente (opcional)
  AudespApiServiceV2.configurar({
    ambiente: 'piloto', // 'piloto' ou 'producao'
    timeout: 30000,
    maxRetries: 3,
    enableAuditLog: true,
    validarSchemaAntes: true
  });

  // Credenciais do usuário no portal AUDESP
  const credenciais: CredenciaisAudesp = {
    email: 'usuario@orgao.sp.gov.br',
    senha: 'senha_portal_audesp'
  };

  try {
    // Fazer login
    const resposta = await AudespApiServiceV2.login(credenciais);

    if (resposta.success) {
      console.log('✅ Login bem-sucedido!');
      console.log('Usuário:', resposta.data?.usuario);
      console.log('Token expira em:', resposta.data?.expire_in, 'segundos');
      
      // Armazenar token no estado da aplicação
      return resposta.data;
    } else {
      console.error('❌ Login falhou:', resposta.error);
      console.log('Dica:', resposta.message);
    }
  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
  }
}

// ============================================================================
// EXEMPLO 2: ENVIAR PRESTAÇÃO DE CONTAS (CONVÊNIO)
// ============================================================================

export async function exemplo2_EnviarPrestacaoContas() {
  console.log('========== EXEMPLO 2: ENVIAR PRESTAÇÃO DE CONTAS ==========');

  // Garantir que está autenticado
  if (!AudespApiServiceV2.estaAutenticado()) {
    console.error('Não autenticado. Faça login primeiro.');
    return;
  }

  // Dados da prestação de contas
  const prestacaoConta = {
    cnpj_cpf_orgao: '14.946.601/0001-72', // CNPJ do órgão
    nome_orgao: 'Secretaria Municipal de Educação',
    periodo_referencia_inicio: '2024-01-01',
    periodo_referencia_fim: '2024-12-31',
    cpf_responsavel: '123.456.789-10',
    email_responsavel: 'responsavel@orgao.sp.gov.br',
    data_transmissao: new Date().toISOString().split('T')[0],
    // Específico para convênio
    numero_convenio: 'CONV-2024-001',
    concedente: 'Governo do Estado',
    valor_conveniado: 50000.00,
    valor_prestado: 50000.00,
    resumo_execucao: 'Execução conforme plano de trabalho aprovado'
  };

  try {
    console.log('Enviando prestação de contas...');
    
    const resposta = await AudespApiServiceV2.enviarPrestacaoContasConvenio(
      prestacaoConta
    );

    if (resposta.success) {
      console.log('✅ Prestação de contas enviada com sucesso!');
      console.log('Protocolo AUDESP:', resposta.data?.protocolo);
      console.log('Data/Hora:', resposta.data?.dataHora);
      console.log('Status:', resposta.data?.status);
      
      return resposta.data?.protocolo;
    } else {
      console.error('❌ Erro ao enviar:', resposta.error);
      console.log('Detalhes:', resposta.message);
      
      // Se houver erros de validação
      if (resposta.data?.erros) {
        console.log('Erros encontrados:');
        resposta.data.erros.forEach(erro => {
          console.log(`- ${erro.mensagem}`);
        });
      }
    }
  } catch (erro) {
    console.error('Erro ao enviar prestação de contas:', erro);
  }
}

// ============================================================================
// EXEMPLO 3: CONSULTAR STATUS DE PROTOCOLO
// ============================================================================

export async function exemplo3_ConsultarProtocolo() {
  console.log('========== EXEMPLO 3: CONSULTAR PROTOCOLO ==========');

  if (!AudespApiServiceV2.estaAutenticado()) {
    console.error('Não autenticado. Faça login primeiro.');
    return;
  }

  const numeroProtocolo = '202401010001'; // Protocolo recebido no envio

  try {
    console.log(`Consultando protocolo: ${numeroProtocolo}...`);
    
    const resposta = await AudespApiServiceV2.consultarProtocolo(
      numeroProtocolo,
      'f5' // Fase V para prestação de contas
    );

    if (resposta.success) {
      console.log('✅ Consulta bem-sucedida!');
      console.log('Status:', resposta.data?.protocolo.status);
      console.log('Descrição:', resposta.data?.protocolo.descricao);
      
      if (resposta.data?.protocolo.status === 'Rejeitado') {
        console.warn('⚠️ Documento foi rejeitado');
        if (resposta.data.protocolo.erros) {
          console.log('Motivos da rejeição:');
          resposta.data.protocolo.erros.forEach(erro => {
            console.log(`- ${erro}`);
          });
        }
      }
      
      // Exibir histórico
      if (resposta.data?.historico) {
        console.log('Histórico:');
        resposta.data.historico.forEach(item => {
          console.log(`${item.data}: ${item.status} - ${item.descricao}`);
        });
      }
    } else {
      console.error('❌ Erro ao consultar:', resposta.error);
    }
  } catch (erro) {
    console.error('Erro ao consultar protocolo:', erro);
  }
}

// ============================================================================
// EXEMPLO 4: ENVIAR EDITAL (FASE IV)
// ============================================================================

export async function exemplo4_EnviarEdital() {
  console.log('========== EXEMPLO 4: ENVIAR EDITAL (FASE IV) ==========');

  if (!AudespApiServiceV2.estaAutenticado()) {
    console.error('Não autenticado. Faça login primeiro.');
    return;
  }

  // Dados do edital
  const edital = {
    cnpj_cpf_orgao: '14.946.601/0001-72',
    nome_orgao: 'Secretaria Municipal de Educação',
    cpf_cpf_responsavel: '123.456.789-10',
    email_responsavel: 'responsavel@orgao.sp.gov.br',
    data_transmissao: new Date().toISOString().split('T')[0],
    numero_edital: 'EDITAL-2024-001',
    ano_edital: 2024,
    data_abertura: '2024-02-15',
    valor_estimado: 100000.00,
    objeto: 'Contratação de serviços de consultoria em gestão pública'
  };

  // Arquivo PDF do edital (opcional)
  const arquivoEdital = {
    nome: 'edital-2024-001.pdf',
    tipo: 'application/pdf',
    tamanhoBytes: 1024000,
    hash: 'abc123',
    conteudo: new Blob() // Blob do arquivo PDF
  };

  try {
    console.log('Enviando edital...');
    
    const resposta = await AudespApiServiceV2.enviarEdital(
      edital,
      arquivoEdital
    );

    if (resposta.success) {
      console.log('✅ Edital enviado com sucesso!');
      console.log('Protocolo:', resposta.data?.protocolo);
    } else {
      console.error('❌ Erro ao enviar edital:', resposta.error);
    }
  } catch (erro) {
    console.error('Erro:', erro);
  }
}

// ============================================================================
// EXEMPLO 5: ENVIAR DECLARAÇÃO NEGATIVA
// ============================================================================

export async function exemplo5_EnviarDeclaraNegativa() {
  console.log('========== EXEMPLO 5: ENVIAR DECLARAÇÃO NEGATIVA ==========');

  if (!AudespApiServiceV2.estaAutenticado()) {
    console.error('Não autenticado. Faça login primeiro.');
    return;
  }

  const declaracao = {
    cnpj_cpf_orgao: '14.946.601/0001-72',
    nome_orgao: 'Secretaria Municipal de Educação',
    periodo_referencia_inicio: '2024-01-01',
    periodo_referencia_fim: '2024-12-31',
    cpf_responsavel: '123.456.789-10',
    email_responsavel: 'responsavel@orgao.sp.gov.br',
    data_transmissao: new Date().toISOString().split('T')[0],
    periodo_ano: 2024,
    motivo_negativa: 'Nenhum repasse recebido no período',
    justificativa: 'O órgão não recebeu recursos para execução no período informado'
  };

  try {
    const resposta = await AudespApiServiceV2.enviarDeclaraNegativa(declaracao);

    if (resposta.success) {
      console.log('✅ Declaração negativa enviada com sucesso!');
      console.log('Protocolo:', resposta.data?.protocolo);
    } else {
      console.error('❌ Erro:', resposta.error);
    }
  } catch (erro) {
    console.error('Erro:', erro);
  }
}

// ============================================================================
// EXEMPLO 6: TRATAMENTO DE ERROS E FALLBACK
// ============================================================================

export async function exemplo6_TratamentoErros() {
  console.log('========== EXEMPLO 6: TRATAMENTO DE ERROS ==========');

  const credenciais: CredenciaisAudesp = {
    email: 'usuario@orgao.sp.gov.br',
    senha: 'senha_incorreta' // Vai falhar propositalmente
  };

  try {
    const resposta = await AudespApiServiceV2.login(credenciais);

    if (!resposta.success) {
      // Erro comum: credenciais inválidas
      if (resposta.status === 401) {
        console.error('❌ Email ou senha incorretos');
        // Mostrar tela de re-login
      }
      
      // Erro comum: dados inválidos
      else if (resposta.status === 400) {
        console.error('❌ Dados inválidos:', resposta.message);
        // Validar formulário
      }
      
      // Erro: servidor indisponível
      else if (resposta.status === 503) {
        console.error('❌ Servidor indisponível. Tente novamente mais tarde.');
        // Mostrar mensagem de manutenção
      }
      
      // Erro genérico
      else {
        console.error('❌ Erro:', resposta.error);
        console.log('Sugestão:', resposta.message);
      }
    }
  } catch (erro) {
    console.error('Erro de conexão:', erro);
    // Mostrar mensagem de erro de rede
  }
}

// ============================================================================
// EXEMPLO 7: AUDITORIA E RELATÓRIOS
// ============================================================================

export function exemplo7_AuditoriaERelatorios() {
  console.log('========== EXEMPLO 7: AUDITORIA E RELATÓRIOS ==========');

  // Obter relatório de atividades do dia
  const relatorio = AudespApiServiceV2.obterRelatorioAuditoria();
  console.log('Relatório do dia:');
  console.log('- Total de operações:', relatorio.totalLogs);
  console.log('- Taxa de sucesso:', relatorio.taxaSucesso);
  console.log('- Usuários ativos:', relatorio.usuariosAtivos);
  console.log('- Atividades:', relatorio.atividades);

  // Exportar logs para auditoria externa
  const logsCSV = AudespApiServiceV2.exportarLogsCSV();
  console.log('Logs exportados em CSV');
  
  const logsJSON = AudespApiServiceV2.exportarLogsJSON();
  console.log('Logs exportados em JSON');

  // Salvar logs para análise
  // localStorage.setItem('audesp_logs_export', logsCSV);
}

// ============================================================================
// EXEMPLO 8: FLUXO COMPLETO - SIMULAÇÃO
// ============================================================================

export async function exemplo8_FluxoCompleto() {
  console.log('========== EXEMPLO 8: FLUXO COMPLETO ==========');

  // Passo 1: Configurar
  AudespApiServiceV2.configurar({
    ambiente: 'piloto',
    validarSchemaAntes: true
  });

  // Passo 2: Login
  console.log('1️⃣ Fazendo login...');
  const loginResp = await AudespApiServiceV2.login({
    email: 'usuario@orgao.sp.gov.br',
    senha: 'senha_correta'
  });

  if (!loginResp.success) {
    console.error('Falha na autenticação');
    return;
  }

  console.log('✅ Autenticado como:', loginResp.data?.usuario?.nome);

  // Passo 3: Enviar Prestação de Contas
  console.log('2️⃣ Enviando prestação de contas...');
  const envioResp = await AudespApiServiceV2.enviarPrestacaoContasConvenio({
    cnpj_cpf_orgao: '14.946.601/0001-72',
    nome_orgao: 'Secretaria Municipal de Educação',
    periodo_referencia_inicio: '2024-01-01',
    periodo_referencia_fim: '2024-12-31',
    cpf_responsavel: '123.456.789-10',
    email_responsavel: 'responsavel@orgao.sp.gov.br',
    data_transmissao: new Date().toISOString().split('T')[0],
    numero_convenio: 'CONV-2024-001',
    concedente: 'Governo do Estado',
    valor_conveniado: 50000.00,
    valor_prestado: 50000.00,
    resumo_execucao: 'Execução conforme plano'
  });

  if (!envioResp.success) {
    console.error('Falha no envio:', envioResp.error);
    return;
  }

  const protocolo = envioResp.data?.protocolo;
  console.log('✅ Enviado com protocolo:', protocolo);

  // Passo 4: Consultar Status
  console.log('3️⃣ Consultando status...');
  const consultaResp = await AudespApiServiceV2.consultarProtocolo(protocolo!, 'f5');

  if (consultaResp.success) {
    console.log('✅ Status:', consultaResp.data?.protocolo.status);
  }

  // Passo 5: Gerar Relatório
  console.log('4️⃣ Gerando relatório de auditoria...');
  const relatorio = AudespApiServiceV2.obterRelatorioAuditoria();
  console.log('✅ Operações realizadas:', relatorio.totalLogs);

  // Passo 6: Logout
  console.log('5️⃣ Fazendo logout...');
  AudespApiServiceV2.logout();
  console.log('✅ Logout realizado');
}

// ============================================================================
// EXECUTAR EXEMPLOS
// ============================================================================

// Descomente para executar um exemplo:
// exemplo1_LoginInicial();
// exemplo8_FluxoCompleto();
