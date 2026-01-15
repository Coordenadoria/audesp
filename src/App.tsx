
import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { INITIAL_DATA, PrestacaoContas, AudespResponse } from './types';

const Sidebar = lazy(() => import('./components/Sidebar').then(m => ({ default: m.Sidebar })));
const FormSections = lazy(() => import('./components/FormSections').then(m => ({ default: m.FormSections })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const FullReportImporter = lazy(() => import('./components/FullReportImporter').then(m => ({ default: m.FullReportImporter })));
const TransmissionResult = lazy(() => import('./components/TransmissionResult').then(m => ({ default: m.TransmissionResult })));

const { login, logout, isAuthenticated, getToken } = (() => {
  try {
    return require('./services/authService');
  } catch {
    return {
      login: async () => ({ token: '', expire_in: 0, token_type: 'bearer' }),
      logout: () => {},
      isAuthenticated: () => false,
      getToken: () => null
    };
  }
})();

const { sendPrestacaoContas } = (() => {
  try {
    return require('./services/transmissionService');
  } catch {
    return { sendPrestacaoContas: async () => ({}) };
  }
})();

const { validatePrestacaoContas, getAllSectionsStatus, validateConsistency } = (() => {
  try {
    return require('./services/validationService');
  } catch {
    return {
      validatePrestacaoContas: () => [],
      getAllSectionsStatus: () => ({}),
      validateConsistency: () => []
    };
  }
})();

const { downloadJson, loadJson } = (() => {
  try {
    return require('./services/fileService');
  } catch {
    return {
      downloadJson: () => {},
      loadJson: async () => ({})
    };
  }
})();

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/1/1a/Bras%C3%A3o_do_estado_de_S%C3%A3o_Paulo.svg";

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
  const [transmissionStatus, setTransmissionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // New State for Detailed Result
  const [audespResult, setAudespResult] = useState<AudespResponse | null>(null);

  // Validation State (Computed)
  const sectionStatus = useMemo(() => getAllSectionsStatus(formData), [formData]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Pre-filled credentials for testing
  const [loginEmail, setLoginEmail] = useState('afpereira@saude.sp.gov.br');
  const [loginPassword, setLoginPassword] = useState('M@dmax2026');
  
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const authTokenRef = useRef<string | null>(authToken);

  useEffect(() => {
      authTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
      try {
          if (isAuthenticated()) {
              setIsLoggedIn(true);
              setAuthToken(getToken());
              const draft = localStorage.getItem('audesp_draft');
              if (draft) {
                 try { setFormData(JSON.parse(draft)); } catch {}
              }
          } else {
              handleLogout();
          }
      } catch (error) {
          console.error("Auth initialization error:", error);
          // Allow app to load even if auth fails
          setIsLoggedIn(false);
      }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 5000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoggingIn(true);
      setLoginError(null);
      try {
          console.log('[App] Iniciando login...');
          const res = await login(loginEmail, loginPassword);
          console.log('[App] Login bem-sucedido, token:', res.token.substring(0, 20) + '...');
          setAuthToken(res.token);
          setIsLoggedIn(true);
          setActiveSection('dashboard');
          showToast("Login no Ambiente Piloto realizado!", "success");
          
          const draft = localStorage.getItem('audesp_draft');
          if (draft) {
             try { setFormData(JSON.parse(draft)); } catch {}
          }
      } catch (err: any) {
          console.error('[App] Erro no login:', err);
          setLoginError(err.message || 'Erro desconhecido ao fazer login');
      } finally {
          setIsLoggingIn(false);
      }
  };

  const handleLogout = () => {
      logout();
      setAuthToken(null);
      setIsLoggedIn(false);
  };

  const handleTransmit = () => {
      setShowTransmissionModal(true);
      setTransmissionStatus('processing');
      setTransmissionLog(["Iniciando processo de transmissão..."]);
      setAudespResult(null);
      
      setTimeout(async () => {
          try {
              if (!isAuthenticated() || !authTokenRef.current) {
                  throw new Error("Sessão expirada. Faça login novamente.");
              }

              setTransmissionLog(prev => [...prev, "Validando estrutura de dados..."]);
              const errors = validatePrestacaoContas(formData);
              
              setTransmissionLog(prev => [...prev, "Verificando consistência contábil (cross-check)..."]);
              const consistencyErrors = validateConsistency(formData);
              
              if (errors.length > 0 || consistencyErrors.length > 0) {
                  setTransmissionStatus('error');
                  setTransmissionLog(["ERRO DE VALIDAÇÃO LOCAL:", ...errors, ...consistencyErrors]);
                  return;
              }

              setTransmissionLog(prev => [...prev, "Validação OK. Enviando JSON para API Piloto Audesp..."]);
              
              // Call the new service
              const res = await sendPrestacaoContas(authTokenRef.current, formData);
              
              // Handle Audesp Logic Status
              if (res.status === 'Rejeitado') {
                  setTransmissionStatus('error');
                  setTransmissionLog(prev => [...prev, "FALHA: Documento Rejeitado pelo Audesp.", `Protocolo: ${res.protocolo}`]);
              } else if (res.status === 'Armazenado') {
                  setTransmissionStatus('success');
                  setTransmissionLog(prev => [...prev, "ALERTA: Documento Armazenado com Ressalvas.", `Protocolo: ${res.protocolo}`]);
              } else {
                  setTransmissionStatus('success');
                  setTransmissionLog(prev => [...prev, "SUCESSO: Documento Recebido.", `Protocolo: ${res.protocolo}`]);
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

              setTransmissionLog(prev => [...prev, "ERRO TÉCNICO NA TRANSMISSÃO:", errorMessage]);
              
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
          <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
              <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                  <div className="text-center mb-6">
                      <img src={LOGO_URL} className="h-16 mx-auto mb-2" alt="Logo" />
                      <h1 className="text-xl font-bold text-slate-800">Audesp Connect - Piloto V</h1>
                      <p className="text-xs text-slate-500 mt-2">Sistema de Prestação de Contas (v1.9.4)</p>
                  </div>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div><label className="text-xs font-bold text-slate-500 uppercase">Email</label><input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="w-full h-10 px-3 border rounded" required placeholder="email@instituicao.org.br" /></div>
                      <div><label className="text-xs font-bold text-slate-500 uppercase">Senha</label><input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} className="w-full h-10 px-3 border rounded" required /></div>
                      {loginError && (
                        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-600 text-xs font-semibold">
                            <strong className="block mb-1 text-red-700">Falha no Login:</strong>
                            <span className="whitespace-pre-line leading-relaxed block">{loginError}</span>
                        </div>
                      )}
                      <button type="submit" disabled={isLoggingIn} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 rounded font-bold transition-colors shadow-sm disabled:opacity-70">{isLoggingIn ? 'Autenticando...' : 'Acessar Ambiente Piloto'}</button>
                  </form>
                  <div className="mt-8 text-center text-[10px] text-slate-400 border-t pt-4">
                      <p>Ambiente Oficial: <span className="font-mono text-slate-600">audesp-piloto.tce.sp.gov.br</span></p>
                      <p className="mt-2 text-yellow-600 bg-yellow-50 inline-block px-2 py-1 rounded">Nota: Reinicie 'npm start' se mudou o Proxy.</p>
                  </div>
              </div>
          </div>
      );
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Carregando aplicação...</p>
      </div>
    </div>
  );

  console.log('[App] Renderizando com isLoggedIn:', isLoggedIn, 'activeSection:', activeSection);

  return (
      <Suspense fallback={<LoadingSpinner />}>
      <div className="flex bg-slate-100 min-h-screen font-sans text-slate-900">
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
              <header className="flex justify-between items-center mb-8">
                  <div>
                      <h1 className="text-2xl font-bold text-slate-800">Prestação de Contas</h1>
                      <p className="text-sm text-slate-500">Audesp Fase V - Piloto Oficial</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">● Conectado ao Piloto</span>
                     <button onClick={handleLogout} className="text-red-600 font-bold text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded transition-colors border border-red-100">SAIR</button>
                  </div>
              </header>
              <div className="max-w-6xl mx-auto pb-20">
                  {activeSection === 'dashboard' ? (
                      <Suspense fallback={<div className="text-center py-8">Carregando Dashboard...</div>}>
                          <Dashboard 
                            data={formData} 
                            sectionStatus={sectionStatus} 
                            onNavigate={setActiveSection} 
                          />
                      </Suspense>
                  ) : (
                      <Suspense fallback={<div className="text-center py-8">Carregando formulário...</div>}>
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
                      </Suspense>
                  )}
              </div>
          </main>
          
          {notification && (
              <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded shadow-xl border-l-4 ${notification.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
                  {notification.message}
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
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                      <div className="p-4 border-b flex justify-between bg-slate-50">
                          <h3 className="font-bold text-slate-800">Processando Transmissão...</h3>
                      </div>
                      <div className="p-6 bg-slate-900 text-green-400 font-mono text-xs h-80 overflow-y-auto whitespace-pre-wrap">
                          {transmissionLog.join('\n')}
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
      </Suspense>
  );
};

export default App;
