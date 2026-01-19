
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { INITIAL_DATA, PrestacaoContas, AudespResponse } from './types';
import { logout, isAuthenticated, getToken } from './services/authService';
import { sendPrestacaoContas } from './services/transmissionService';
import { validatePrestacaoContas, getAllSectionsStatus, validateConsistency } from './services/validationService';
import { downloadJson, loadJson } from './services/fileService';
import { Sidebar } from './components/Sidebar';
import { FormSections } from './components/FormSections';
import { FullReportImporter } from './components/FullReportImporter';
import { TransmissionResult } from './components/TransmissionResult';
import ReportsDashboard from './components/ReportsDashboard';
import EnhancedLoginComponent from './components/EnhancedLoginComponent';
import BatchPDFImporter from './components/BatchPDFImporter';
import ValidationDashboard from './components/ValidationDashboard';

interface Notification {
    message: string;
    type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [formData, setFormData] = useState<PrestacaoContas>(INITIAL_DATA);
  const [transmissionLog, setTransmissionLog] = useState<string[]>([]);
  const [showTransmissionModal, setShowTransmissionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // New State for Detailed Result
  const [audespResult, setAudespResult] = useState<AudespResponse | null>(null);
  const [transmissionStatus, setTransmissionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transmissionErrors, setTransmissionErrors] = useState<{ field: string; message: string }[]>([]);

  // Validation State (Computed)
  const sectionStatus = useMemo(() => getAllSectionsStatus(formData), [formData]);

  // Auth State - Enhanced with Environment
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authEnvironment, setAuthEnvironment] = useState<'piloto' | 'producao'>('piloto');
  const [authCpf, setAuthCpf] = useState<string>('');
  


  // Validation Dashboard
  const [activeTab, setActiveTab] = useState<'form' | 'pdf' | 'validation'>('form');

  const authTokenRef = useRef<string | null>(authToken);

  useEffect(() => {
      authTokenRef.current = authToken;
  }, [authToken]);

  // Close modal on ESC key
  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && showTransmissionModal) {
              setShowTransmissionModal(false);
              setTransmissionLog([]);
              setTransmissionErrors([]);
          }
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, [showTransmissionModal]);

  useEffect(() => {
      try {
          // Check if already authenticated
          if (isAuthenticated()) {
              setIsLoggedIn(true);
              setAuthToken(getToken());
              const draft = localStorage.getItem('audesp_draft');
              if (draft) {
                 try { setFormData(JSON.parse(draft)); } catch {}
              }
          } else {
              // Check for demo mode (localhost or development)
              const isDemoMode = typeof window !== 'undefined' && 
                  (window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('10.0'));
              
              if (isDemoMode || localStorage.getItem('audesp_demo_mode')) {
                  // Allow demo access without login
                  setIsLoggedIn(true);
                  setAuthToken('demo-token-dev');
                  setAuthEnvironment('piloto');
                  setAuthCpf('00000000000');
                  localStorage.setItem('audesp_demo_mode', 'true');
                  
                  const draft = localStorage.getItem('audesp_draft');
                  if (draft) {
                     try { setFormData(JSON.parse(draft)); } catch {}
                  }
              } else {
                  handleLogout();
              }
          }
      } catch (error) {
          console.error("Auth initialization error:", error);
          // Allow demo mode on error
          setIsLoggedIn(true);
          setAuthToken('demo-token-recovery');
          setAuthEnvironment('piloto');
          setAuthCpf('00000000000');
      }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 5000);
  };

  const handleLogout = () => {
      logout();
      setAuthToken(null);
      setIsLoggedIn(false);
      setAuthCpf('');
      setAuthEnvironment('piloto');
      setActiveTab('form');
  };

  // Enhanced Login Handler from EnhancedLoginComponent
  const handleEnhancedLoginSuccess = (token: string, environment: 'piloto' | 'producao', cpf: string) => {
      // Save token to sessionStorage for isAuthenticated() to work
      sessionStorage.setItem('audesp_token', token);
      sessionStorage.setItem('audesp_expire', String(Date.now() + 8 * 60 * 60 * 1000)); // 8 hours
      
      setAuthToken(token);
      setAuthEnvironment(environment);
      setAuthCpf(cpf);
      setIsLoggedIn(true);
      setActiveSection('dashboard');
      setActiveTab('form');
      showToast(`Login no ambiente ${environment} realizado com sucesso!`, "success");
      
      const draft = localStorage.getItem('audesp_draft');
      if (draft) {
         try { setFormData(JSON.parse(draft)); } catch {}
      }
  };

  const handleEnhancedLoginError = (error: string) => {
      showToast(error, "error");
  };

  const handleTransmit = () => {
      setShowTransmissionModal(true);
      setTransmissionStatus('processing');
      setTransmissionLog(["⏳ Iniciando processo de transmissão...", "Aguarde..."]);
      setTransmissionErrors([]);
      setAudespResult(null);
      
      // Use setTimeout to allow modal to render before starting async work
      setTimeout(async () => {
          try {
              console.log('[Transmit] Starting transmission process');
              
              // Get token from sessionStorage (set by enhanced login)
              const token = sessionStorage.getItem('audesp_token') || authTokenRef.current;
              
              // Check authentication
              if (!token) {
                  const authError = "❌ Sessão expirada. Faça login novamente.";
                  setTransmissionLog([authError]);
                  setTransmissionStatus('error');
                  setTransmissionErrors([{ field: 'Autenticação', message: 'Token não disponível' }]);
                  console.error('[Transmit]', authError);
                  console.error('[Transmit] Debug:', {
                      'sessionStorage token': sessionStorage.getItem('audesp_token') ? 'sim' : 'não',
                      'authTokenRef.current': authTokenRef.current ? 'sim' : 'não',
                      'isLoggedIn': isLoggedIn,
                      'authToken': authToken ? 'sim' : 'não'
                  });
                  return;
              }

              // Step 1: Local Validation
              setTransmissionLog(prev => [...prev, "📋 Validando estrutura de dados (schema)..."]);
              const errors = validatePrestacaoContas(formData);
              console.log('[Transmit] Validation errors:', errors.length);
              
              // Step 2: Consistency Check
              setTransmissionLog(prev => [...prev, "🔗 Verificando consistência contábil (cross-check)..."]);
              const consistencyErrors = validateConsistency(formData);
              console.log('[Transmit] Consistency errors:', consistencyErrors.length);
              
              // If validation fails, show errors and stop
              if (errors.length > 0 || consistencyErrors.length > 0) {
                  setTransmissionStatus('error');
                  
                  // Parse errors to extract field names and messages
                  const parsedErrors = [
                      ...errors.map((err, idx) => {
                          const match = err.match(/Campo: (.+?)\s*(?:\||$)/);
                          const field = match ? match[1] : `Erro ${idx + 1}`;
                          return { field, message: err };
                      }),
                      ...consistencyErrors.map((err, idx) => {
                          const match = err.match(/Campo: (.+?)\s*(?:\||$)/);
                          const field = match ? match[1] : `Consistência ${idx + 1}`;
                          return { field, message: err };
                      })
                  ];
                  
                  setTransmissionErrors(parsedErrors);
                  setTransmissionLog([
                      "❌ ERRO DE VALIDAÇÃO LOCAL:",
                      `📊 ${errors.length} erro(s) de validação encontrado(s)`,
                      `🔗 ${consistencyErrors.length} erro(s) de consistência encontrado(s)`,
                      "",
                      "CAMPOS COM PROBLEMAS:",
                      ...parsedErrors.map(e => `  ⚠️  ${e.field}`)
                  ]);
                  console.log('[Transmit] Validation failed, stopping transmission');
                  return;
              }

              // Step 3: Send to Audesp
              setTransmissionLog(prev => [...prev, "✅ Validação local OK!", "🌐 Enviando para Audesp Piloto..."]);
              console.log('[Transmit] All validations passed, sending to Audesp');
              
              // Call the transmission service
              let res: AudespResponse;
              try {
                  res = await sendPrestacaoContas(token, formData, authCpf);
                  console.log('[Transmit] Response received:', res);
              } catch (sendError: any) {
                  // Network or service error
                  setTransmissionStatus('error');
                  const errorMessage = sendError.message || String(sendError);
                  setTransmissionLog(prev => [
                      ...prev,
                      "❌ ERRO NA TRANSMISSÃO:",
                      errorMessage,
                      "",
                      "💡 SUGESTÕES:",
                      "  • Verifique sua conexão com a internet",
                      "  • Tente novamente em alguns segundos",
                      "  • Se o erro persistir, contate o administrador"
                  ]);
                  setTransmissionErrors([{ 
                      field: 'Transmissão', 
                      message: errorMessage 
                  }]);
                  console.error('[Transmit] Transmission failed:', sendError);
                  return;
              }
              
              // Step 4: Handle Audesp Response
              console.log('[Transmit] Processing response, status:', res.status);
              
              if (res.status === 'Rejeitado') {
                  setTransmissionStatus('error');
                  
                  // Extract rejection reasons if available
                  const rejectionErrors = (res as any).erros || [];
                  setTransmissionErrors(
                      rejectionErrors.map((err: any) => ({
                          field: err.campo || err.field || 'Desconhecido',
                          message: err.mensagem || err.message || JSON.stringify(err)
                      }))
                  );
                  
                  setTransmissionLog(prev => [
                      ...prev, 
                      "",
                      "❌ DOCUMENTO REJEITADO PELO AUDESP", 
                      `📄 Protocolo: ${res.protocolo}`,
                      "",
                      "🔴 MOTIVOS DA REJEIÇÃO:",
                      ...rejectionErrors.map((e: any) => `  • ${e.campo || e.field}: ${e.mensagem || e.message}`)
                  ]);
              } else if (res.status === 'Armazenado') {
                  setTransmissionStatus('success');
                  setTransmissionLog(prev => [...prev, "", "⚠️  ALERTA: Documento Armazenado com Ressalvas.", `📄 Protocolo: ${res.protocolo}`]);
              } else {
                  setTransmissionStatus('success');
                  setTransmissionLog(prev => [...prev, "✅ SUCESSO: Documento Recebido.", `Protocolo: ${res.protocolo}`]);
              }

              // Show detailed result modal
              setAudespResult(res);
              setShowTransmissionModal(false); // Close log modal to show result modal

          } catch (err: any) {
              setTransmissionStatus('error');
              let errorMessage = err.message;
              
              // Try to format JSON error messages nicely
              try {
                  const jsonErr = JSON.parse(errorMessage);
                  errorMessage = JSON.stringify(jsonErr, null, 2);
              } catch {
                  // Not JSON, use original string
              }

              setTransmissionLog(prev => [...prev, "❌ ERRO TÉCNICO NA TRANSMISSÃO:", errorMessage]);
              
              if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
                  setTimeout(() => handleLogout(), 3000);
              }
          }
      }, 500);
  };

  // --- File Handlers ---
  const handleDownload = () => {
      try {
          downloadJson(formData);
          showToast("Arquivo JSON baixado com sucesso!", "success");
      } catch (err) {
          showToast("Erro ao gerar arquivo.", "error");
      }
  };

  const handleLoadJson = async (file: File) => {
      try {
          const data = await loadJson(file);
          setFormData(data);
          showToast("Dados carregados com sucesso!", "success");
      } catch (err: any) {
          showToast(`Erro ao ler arquivo: ${err.message}`, "error");
      }
  };

  const handleFullImportMerge = (importedData: Partial<PrestacaoContas>) => {
      setFormData(prev => {
          const next = { ...prev };
          // Simplified merge for key arrays
          if (importedData.relacao_empregados) next.relacao_empregados = [...(prev.relacao_empregados || []), ...importedData.relacao_empregados];
          if (importedData.contratos) next.contratos = [...(prev.contratos || []), ...importedData.contratos];
          if (importedData.documentos_fiscais) next.documentos_fiscais = [...(prev.documentos_fiscais || []), ...importedData.documentos_fiscais];
          if (importedData.pagamentos) next.pagamentos = [...(prev.pagamentos || []), ...importedData.pagamentos];
          if (importedData.empenhos) next.empenhos = [...(prev.empenhos || []), ...importedData.empenhos];
          
          if (importedData.descritor && importedData.descritor.ano) {
              next.descritor = { ...prev.descritor, ...importedData.descritor };
          }
          return next;
      });
      setShowImportModal(false);
      showToast("Dados importados e mesclados com sucesso!", "success");
  };

  const handleNewForm = () => {
      if(window.confirm("Tem certeza? Isso apagará todos os dados atuais.")) {
          setFormData(INITIAL_DATA);
          localStorage.removeItem('audesp_draft');
          showToast("Formulário reiniciado.", "info");
      }
  };

  const updateField = (path: string, value: any) => {
      if (typeof path !== 'string') {
          console.error("CRITICAL: updateField received invalid path. Ignoring.", path, value);
          return;
      }
      setFormData(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          const parts = path.split('.');
          let ref = next;
          for (let i = 0; i < parts.length - 1; i++) ref = ref[parts[i]] = ref[parts[i]] || {};
          ref[parts[parts.length - 1]] = value;
          return next;
      });
  };

  const addItem = (path: string, item: any) => {
      if (typeof path !== 'string') {
          console.error("CRITICAL: addItem received invalid path.", path);
          return;
      }
      setFormData(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          const parts = path.split('.');
          let ref = next;
          for (let i = 0; i < parts.length - 1; i++) ref = ref[parts[i]] = ref[parts[i]] || {};
          const key = parts[parts.length - 1];
          if (!Array.isArray(ref[key])) ref[key] = [];
          ref[key].push(item);
          return next;
      });
  };

  const updateItem = (path: string, index: number, field: string, value: any) => {
     if (typeof path !== 'string') {
         console.error("CRITICAL: updateItem received invalid path.", path);
         return;
     }
     setFormData(prev => {
         const next = JSON.parse(JSON.stringify(prev));
         const parts = path.split('.');
         let ref = next;
         for (let i = 0; i < parts.length; i++) ref = ref[parts[i]];
         if (Array.isArray(ref) && ref[index]) {
             const itemParts = field.split('.');
             let itemRef = ref[index];
             for(let k=0; k<itemParts.length-1; k++) itemRef = itemRef[itemParts[k]] = itemRef[itemParts[k]] || {};
             itemRef[itemParts[itemParts.length-1]] = value;
         }
         return next;
     });
  };

  const removeItem = (path: string, index: number) => {
      if (typeof path !== 'string') return;
      setFormData(prev => {
          const next = JSON.parse(JSON.stringify(prev));
          const parts = path.split('.');
          let ref = next;
          for (let i = 0; i < parts.length - 1; i++) ref = ref[parts[i]];
          const key = parts[parts.length - 1];
          if (Array.isArray(ref[key])) ref[key].splice(index, 1);
          return next;
      });
  };

  if (!isLoggedIn) {
      return (
          <div className="flex items-center justify-center h-screen bg-slate-100">
              <EnhancedLoginComponent
                  onLoginSuccess={handleEnhancedLoginSuccess}
                  onError={handleEnhancedLoginError}
              />
          </div>
      );
  }

  console.log('[App] Renderizando com isLoggedIn:', isLoggedIn, 'activeSection:', activeSection);

  // Tab Navigation Component
  const TabNavigation = () => (
    <div className="flex gap-2 border-b border-slate-200 mb-6 bg-white rounded-t-lg p-4">
      <button
        onClick={() => setActiveTab('form')}
        className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
          activeTab === 'form'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-blue-400'
        }`}
      >
        📋 Formulário
      </button>
      <button
        onClick={() => setActiveTab('pdf')}
        className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
          activeTab === 'pdf'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-blue-400'
        }`}
      >
        📄 PDFs (IA)
      </button>
      <button
        onClick={() => setActiveTab('validation')}
        className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
          activeTab === 'validation'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-blue-400'
        }`}
      >
        ✓ Validação
      </button>
    </div>
  );

  return (
      <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
          <Sidebar
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
            onTransmit={handleTransmit} 
            onDownload={handleDownload} 
            onLoadJson={handleLoadJson} 
            onNew={handleNewForm} 
            onSaveDraft={() => {
                localStorage.setItem('audesp_draft', JSON.stringify(formData));
                showToast("Rascunho salvo no navegador.", "success");
            }} 
            onImportFullPdf={() => setShowImportModal(true)}
            sectionStatus={sectionStatus}
          />
          <main className="flex-1 ml-64 p-8">
              <header className="flex justify-between items-center mb-8 bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                  <div>
                      <h1 className="text-3xl font-bold text-slate-800">Prestação de Contas</h1>
                      <p className="text-sm text-slate-500 mt-1">
                          Audesp Fase V - {authEnvironment === 'piloto' ? '🧪 Ambiente Piloto' : '🚀 Ambiente Produção'} | CPF: {authCpf}
                      </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            authEnvironment === 'piloto'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                            {authEnvironment === 'piloto' ? '● Piloto (Teste)' : '● Produção (Real)'}
                        </span>
                     </div>
                     <button onClick={handleLogout} className="text-red-600 font-bold text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded transition-colors border border-red-100">
                         SAIR
                     </button>
                  </div>
              </header>

              <div className="max-w-7xl mx-auto pb-20">
                  {/* Main Tab Navigation */}
                  {activeSection === 'dashboard' && <TabNavigation />}

                  {/* Dashboard View */}
                  {activeSection === 'dashboard' ? (
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                          {activeTab === 'form' && (
                              <div className="p-6">
                                  <FormSections 
                                      activeSection={activeSection} 
                                      formData={formData} 
                                      updateField={updateField} 
                                      updateItem={updateItem} 
                                      addItem={addItem} 
                                      removeItem={removeItem} 
                                      handleExtraction={()=>{}} 
                                      handleDownload={handleDownload} 
                                  />
                              </div>
                          )}

                          {activeTab === 'pdf' && (
                              <div className="p-6">
                                  <div className="mb-6">
                                      <h2 className="text-2xl font-bold text-slate-800 mb-2">🤖 Processamento de PDFs com IA Avançada</h2>
                                      <p className="text-slate-600">Envie múltiplos PDFs e deixe o Claude 3.5 Sonnet classificar e extrair dados automaticamente</p>
                                  </div>
                                  <BatchPDFImporter
                                      formData={formData}
                                      onDocumentsProcessed={(results) => {
                                          console.log('PDFs processados:', results);
                                          showToast(`${results.totalFiles} arquivos processados com sucesso!`, "success");
                                      }}
                                      onApplySuggestions={(field, value) => {
                                          updateField(field, value);
                                          showToast(`Campo ${field} preenchido automaticamente!`, "success");
                                      }}
                                  />
                              </div>
                          )}

                          {activeTab === 'validation' && (
                              <div className="p-6">
                                  <ValidationDashboard
                                      formData={formData}
                                      userId={authCpf}
                                  />
                              </div>
                          )}
                      </div>
                  ) : activeSection === 'reports' ? (
                      <ReportsDashboard 
                        formData={formData} 
                        setFormData={setFormData} 
                        userId={authCpf}
                      />
                  ) : (
                      <FormSections 
                      activeSection={activeSection} 
                      formData={formData} 
                      updateField={updateField} 
                      updateItem={updateItem} 
                      addItem={addItem} 
                      removeItem={removeItem} 
                      handleExtraction={()=>{}} 
                      handleDownload={handleDownload} 
                  />
                  )}
              </div>
          </main>
          
          {notification && (
              <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl border-l-4 animate-in fade-in slide-in-from-right ${notification.type === 'error' ? 'bg-white border-red-500 text-red-700' : notification.type === 'success' ? 'bg-white border-green-500 text-green-700' : 'bg-white border-blue-500 text-blue-700'}`}>
                  <p className="font-semibold">{notification.message}</p>
              </div>
          )}

          {showImportModal && (
              <FullReportImporter 
                  onDataMerge={handleFullImportMerge} 
                  onCancel={() => setShowImportModal(false)} 
              />
          )}

          {/* Simple Log Modal (Shows while processing) */}
          {showTransmissionModal && !audespResult && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden">
                      <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100">
                          <h3 className="font-bold text-slate-800 text-lg">
                              {transmissionStatus === 'processing' ? '⏳ Processando Transmissão...' : 
                               transmissionStatus === 'error' ? '❌ Erro na Transmissão' : '✅ Transmissão Completa'}
                          </h3>
                          <button
                              onClick={() => {
                                  setShowTransmissionModal(false);
                                  setTransmissionLog([]);
                                  setTransmissionErrors([]);
                              }}
                              className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded p-1 transition-colors"
                              title="Fechar (ESC)"
                          >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                          </button>
                      </div>
                      <div className="p-6 bg-slate-900 text-green-400 font-mono text-xs h-80 overflow-y-auto whitespace-pre-wrap">
                          {transmissionLog.join('\n')}
                      </div>
                      {transmissionStatus === 'error' && transmissionErrors.length > 0 && (
                          <div className="border-t bg-red-50 p-4">
                              <h4 className="font-bold text-red-700 mb-3">🔴 Campos com Problemas:</h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {transmissionErrors.map((err, idx) => (
                                      <div key={idx} className="bg-white p-2 rounded border-l-4 border-red-500">
                                          <div className="font-bold text-red-700">{err.field}</div>
                                          <div className="text-sm text-red-600">{err.message}</div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                      <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                          <button
                              onClick={() => {
                                  setShowTransmissionModal(false);
                                  setTransmissionLog([]);
                                  setTransmissionErrors([]);
                              }}
                              className="px-4 py-2 bg-slate-600 text-white rounded font-bold hover:bg-slate-700"
                          >
                              Fechar
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* Detailed Result Modal (Shows after finish) */}
          {audespResult && (
              <TransmissionResult 
                  result={audespResult} 
                  onClose={() => setAudespResult(null)} 
              />
          )}
      </div>
  );
};

export default App;
