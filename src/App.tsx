
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
import { CredentialsModal } from './components/CredentialsModal';
import { ErrorHelpPanel } from './components/ErrorHelpPanel';
import EnhancedLoginComponent from './components/EnhancedLoginComponent';
import BatchPDFImporter from './components/BatchPDFImporter';
import ErrorDiagnosticsService, { ErrorDiagnostic } from './services/errorDiagnosticsService';
import ModernMainLayout from './components/ModernMainLayout';

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

  // Credentials Modal State
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  // Error Help Panel State
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const [errorPanelData, setErrorPanelData] = useState<any>(null);
  const [errorPanelDiagnostics, setErrorPanelDiagnostics] = useState<ErrorDiagnostic[]>([]);

  // Validation State (Computed)
  const sectionStatus = useMemo(() => getAllSectionsStatus(formData), [formData]);

  // Auth State - Enhanced with Environment
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authEnvironment, setAuthEnvironment] = useState<'piloto' | 'producao'>('piloto');
  const [authCpf, setAuthCpf] = useState<string>('');

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

  const handleRetryWithNewLogin = () => {
      // Clear old tokens
      sessionStorage.removeItem('audesp_token');
      sessionStorage.removeItem('audesp_expire');
      localStorage.removeItem('audesp_token');
      
      // Close transmission modal
      setShowTransmissionModal(false);
      setTransmissionLog([]);
      setTransmissionErrors([]);
      setAudespResult(null);
      
      // Logout and go to login
      handleLogout();
      setActiveSection('dashboard');
      showToast("🔄 Faça login novamente para obter um novo token", "info");
  };

  const handleTransmit = () => {
      // Show credentials modal first before transmission
      setShowCredentialsModal(true);
  };

  const handleCredentialsConfirmed = (cpf: string, email: string) => {
      setShowCredentialsModal(false);
      
      // Update credentials
      setAuthCpf(cpf);
      
      // Now proceed with transmission
      setShowTransmissionModal(true);
      setTransmissionStatus('processing');
      setTransmissionLog([
          "⏳ Iniciando processo de transmissão...",
          `👤 Usuário: ${cpf}${email ? ` / ${email}` : ''}`,
          "Aguarde..."
      ]);
      setTransmissionErrors([]);
      setAudespResult(null);
      
      // Use setTimeout to allow modal to render before starting async work
      setTimeout(async () => {
          try {
              console.log('[Transmit] Starting transmission process');
              
              // Debug: Check all token sources
              const tokenFromSessionStorage = sessionStorage.getItem('audesp_token');
              const expireFromSessionStorage = sessionStorage.getItem('audesp_expire');
              
              console.log('[Transmit] Token sources:', {
                  sessionStorageToken: tokenFromSessionStorage?.substring(0, 20) + '...',
                  sessionStorageExpire: expireFromSessionStorage,
                  authTokenRef: authTokenRef.current?.substring(0, 20) + '...',
                  authTokenState: authToken?.substring(0, 20) + '...',
                  authCpf: authCpf
              });

              // Get token - check sessionStorage first (highest priority), then state
              let token = sessionStorage.getItem('audesp_token') || authToken || authTokenRef.current;
              
              // Check authentication
              if (!token) {
                  const authError = "❌ Sessão expirada. Faça login novamente.";
                  setTransmissionLog([authError]);
                  setTransmissionStatus('error');
                  setTransmissionErrors([{ field: 'Autenticação', message: 'Token não disponível' }]);
                  console.error('[Transmit]', authError, { 
                      sessionStorage: !!tokenFromSessionStorage,
                      authToken: !!authToken,
                      authRef: !!authTokenRef.current
                  });
                  return;
              }

              // Check token expiration
              const expireTime = sessionStorage.getItem('audesp_expire');
              if (expireTime && Date.now() > parseInt(expireTime)) {
                  const expireError = "❌ Token expirado. Faça login novamente.";
                  setTransmissionLog([expireError]);
                  setTransmissionStatus('error');
                  setTransmissionErrors([{ field: 'Autenticação', message: 'Token expirado' }]);
                  console.error('[Transmit]', expireError, { 
                      now: Date.now(),
                      expireTime: parseInt(expireTime),
                      diff: parseInt(expireTime) - Date.now()
                  });
                  return;
              }

              // Ensure token doesn't have "Bearer " prefix (sendPrestacaoContas will add it)
              if (token.startsWith('Bearer ')) {
                  token = token.substring(7);
                  console.log('[Transmit] Removed Bearer prefix from token');
              }
              
              console.log('[Transmit] Token validated and ready:', {
                  hasToken: !!token,
                  tokenLength: token?.length,
                  tokenPrefix: token?.substring(0, 20),
                  cpf: authCpf,
                  expiresIn: expireTime ? Math.ceil((parseInt(expireTime) - Date.now()) / 1000) + 's' : 'unknown'
              });

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
                  
                  // Parse error for ErrorHelpPanel
                  let errorObject: any = {
                    status: 0,
                    message: errorMessage
                  };
                  
                  // Try to extract JSON error from message
                  try {
                    const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      errorObject = JSON.parse(jsonMatch[0]);
                    }
                  } catch (parseErr) {
                    console.debug('[Transmit] Could not parse error JSON:', parseErr);
                  }
                  
                  console.log('[Transmit] Parsed error object:', errorObject);
                  
                  // Show ErrorHelpPanel with error details
                  setErrorPanelData(errorObject);
                  const diagnostics = ErrorDiagnosticsService.diagnoseError(errorObject);
                  console.log('[Transmit] Generated diagnostics:', diagnostics);
                  setErrorPanelDiagnostics(diagnostics);
                  setShowErrorPanel(true);
                  
                  setTransmissionLog(prev => [
                      ...prev,
                      "❌ ERRO NA TRANSMISSÃO:",
                      errorMessage,
                      "",
                      "💡 SUGESTÕES:",
                      "  • Clique em '📄 Ver JSON com Erros' para análise detalhada",
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

  return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
          {/* MAIN CONTENT - Modern Layout */}
          <ModernMainLayout
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              formData={formData}
              updateField={updateField}
              updateItem={updateItem}
              addItem={addItem}
              removeItem={removeItem}
              handleExtraction={() => {}}
              handleDownload={handleDownload}
              onTransmit={handleTransmit}
              isLoading={transmissionStatus === 'processing'}
              sectionStatus={sectionStatus}
          />

          {/* MODALS & NOTIFICATIONS */}
          {notification && (
              <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl border-l-4 ${notification.type === 'error' ? 'bg-white border-red-500 text-red-700' : notification.type === 'success' ? 'bg-white border-green-500 text-green-700' : 'bg-white border-blue-500 text-blue-700'}`}>
                  <p className="font-semibold">{notification.message}</p>
              </div>
          )}

          {showImportModal && (
              <FullReportImporter 
                  onDataMerge={handleFullImportMerge} 
                  onCancel={() => setShowImportModal(false)} 
              />
          )}

          {showCredentialsModal && (
              <CredentialsModal
                  isOpen={showCredentialsModal}
                  onConfirm={handleCredentialsConfirmed}
                  onCancel={() => {
                      setShowCredentialsModal(false);
                  }}
                  currentCpf={authCpf}
              />
          )}

          {audespResult && (
              <TransmissionResult 
                  result={audespResult} 
                  onClose={() => setAudespResult(null)} 
              />
          )}

          {showErrorPanel && (
              <ErrorHelpPanel
                  error={errorPanelData || {}}
                  jsonData={formData}
                  diagnostics={errorPanelDiagnostics}
                  onDismiss={() => {
                      setShowErrorPanel(false);
                      setErrorPanelData(null);
                  }}
                  onRetry={() => {
                      setShowErrorPanel(false);
                      handleTransmit();
                  }}
                  onAutoFix={(fixedData) => {
                      setFormData(fixedData);
                      setShowErrorPanel(false);
                  }}
              />
          )}
      </div>
  );
};

export default App;
