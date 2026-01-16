/**
 * COMPONENTE EXEMPLO: Dashboard de Relatórios e Auditoria
 * Demonstra integração completa dos novos serviços
 */

import React, { useState, useMemo, useCallback } from 'react';
import { PrestacaoContas } from '../types';

// Importar validadores
import { validatePrestacaoContas, generateConsistencyReport } from '../services/advancedValidationService';

// Importar auditoria
import { AuditLogger, IntegrityChecker, AuditReportGenerator } from '../services/auditService';

// Importar relatórios
import { ExecutiveReportGenerator, ReportDownloader } from '../services/reportService';

// Importar import/export
import { ExportService, ImportService, BackupService } from '../services/enhancedFileService';

interface DashboardProps {
  formData: PrestacaoContas;
  setFormData: (data: PrestacaoContas) => void;
  userId?: string;
}

export const ReportsDashboard: React.FC<DashboardProps> = ({ formData, setFormData, userId }) => {
  const [activeTab, setActiveTab] = useState<'validation' | 'reports' | 'audit' | 'backup'>('validation');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ==================== VALIDAÇÃO ====================

  const validationResult = useMemo(() => {
    return validatePrestacaoContas(formData);
  }, [formData]);

  const consistencyReport = useMemo(() => {
    return generateConsistencyReport(formData);
  }, [formData]);

  const handleValidate = useCallback(() => {
    AuditLogger.logValidation(!validationResult.isValid, validationResult.errors.length, userId);
    setMessage({
      type: validationResult.isValid ? 'success' : 'error',
      text: `Validação: ${validationResult.isValid ? 'Sem erros!' : validationResult.errors.length + ' erros encontrados'}`
    });
  }, [validationResult, userId]);

  // ==================== RELATÓRIOS ====================

  const handleGenerateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const report = ExecutiveReportGenerator.generate(formData, validationResult, userId);
      const html = ExecutiveReportGenerator.exportAsHTML(report);
      ReportDownloader.openInNewTab(html);

      AuditLogger.logExport('HTML', userId);
      setMessage({
        type: 'success',
        text: 'Relatório gerado com sucesso!'
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Erro ao gerar relatório: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validationResult, userId]);

  const handleDownloadJSON = useCallback(() => {
    const json = ExportService.exportAsJSON(formData, `Prestação ${formData.descritor.ano}/${formData.descritor.mes}`);
    ExportService.download(
      json,
      `prestacao_contas_${formData.descritor.entidade}_${formData.descritor.mes}_${formData.descritor.ano}.json`
    );

    AuditLogger.logExport('JSON', userId);
    setMessage({
      type: 'success',
      text: 'Arquivo JSON baixado com sucesso!'
    });
  }, [formData, userId]);

  const handleDownloadCSV = useCallback(() => {
    const csv = ExportService.exportAsCSV(formData);
    ExportService.download(
      csv,
      `prestacao_contas_${formData.descritor.entidade}_${formData.descritor.mes}_${formData.descritor.ano}.csv`,
      'text/csv;charset=utf-8'
    );

    AuditLogger.logExport('CSV', userId);
    setMessage({
      type: 'success',
      text: 'Arquivo CSV baixado com sucesso!'
    });
  }, [formData, userId]);

  // ==================== AUDITORIA ====================

  const auditReport = useMemo(() => {
    return AuditReportGenerator.generateReport();
  }, []);

  const handleDownloadAuditReport = useCallback(() => {
    const jsonReport = AuditReportGenerator.exportReportJSON();
    ExportService.download(
      jsonReport,
      `audit_report_${new Date().toISOString().split('T')[0]}.json`
    );

    setMessage({
      type: 'success',
      text: 'Relatório de auditoria baixado!'
    });
  }, []);

  const handleDownloadAuditCSV = useCallback(() => {
    const csvReport = AuditReportGenerator.exportReportCSV();
    ExportService.download(
      csvReport,
      `audit_report_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8'
    );

    setMessage({
      type: 'success',
      text: 'Relatório de auditoria (CSV) baixado!'
    });
  }, []);

  // ==================== BACKUP ====================

  const backups = useMemo(() => {
    return BackupService.getBackups();
  }, []);

  const handleCreateBackup = useCallback(() => {
    const backup = BackupService.createBackup(formData, userId);
    setMessage({
      type: 'success',
      text: `Backup criado: ${backup.id.substring(0, 20)}...`
    });
  }, [formData, userId]);

  const handleRestoreBackup = useCallback((backupId: string) => {
    const restored = BackupService.restoreBackup(backupId, userId);
    if (restored) {
      setFormData(restored);
      setMessage({
        type: 'success',
        text: 'Backup restaurado com sucesso!'
      });
    } else {
      setMessage({
        type: 'error',
        text: 'Erro ao restaurar backup'
      });
    }
  }, [setFormData, userId]);

  const handleDeleteBackup = useCallback((backupId: string) => {
    const success = BackupService.removeBackup(backupId, userId);
    if (success) {
      setMessage({
        type: 'success',
        text: 'Backup removido'
      });
    } else {
      setMessage({
        type: 'error',
        text: 'Erro ao remover backup'
      });
    }
  }, [userId]);

  // ==================== IMPORT ====================

  const handleImportJSON = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const { data, validation } = await ImportService.importJSON(file, userId);

      if (validation.isValid) {
        setFormData(data);
        setMessage({
          type: 'success',
          text: 'Arquivo importado com sucesso!'
        });
      } else {
        setMessage({
          type: 'error',
          text: `Erros encontrados: ${validation.errors.slice(0, 3).join('; ')}`
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Erro ao importar: ${error.message}`
      });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  }, [setFormData, userId]);

  // ==================== INTEGRIDADE ====================

  const handleVerifyIntegrity = useCallback(async () => {
    setIsLoading(true);
    try {
      const isValid = await IntegrityChecker.verifyIntegrity(formData);
      const hasChanged = await IntegrityChecker.detectUnregisteredChanges(formData);

      setMessage({
        type: isValid && !hasChanged ? 'success' : 'info',
        text: `Integridade: ${isValid ? '✅ Válida' : '❌ Alterada'} | Mudanças: ${hasChanged ? 'Sim' : 'Não'}`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Erro: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const handleRegisterChecksum = useCallback(async () => {
    setIsLoading(true);
    try {
      const check = await IntegrityChecker.registerIntegrityCheck(formData, userId);
      setMessage({
        type: 'success',
        text: `Checksum registrado: ${check.dataHash.substring(0, 16)}...`
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Erro: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, userId]);

  // ==================== RENDER ====================

  return (
    <div className="reports-dashboard">
      <style>{`
        .reports-dashboard {
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin: 20px 0;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e5e5;
        }

        .tab-button {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          transition: all 0.3s;
        }

        .tab-button.active {
          color: #1e40af;
          border-bottom-color: #1e40af;
        }

        .tab-button:hover {
          color: #1e40af;
        }

        .tab-content {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section {
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 10px;
          border-left: 4px solid #1e40af;
          padding-left: 10px;
        }

        .button-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }

        .btn-primary {
          background-color: #1e40af;
          color: white;
        }

        .btn-primary:hover {
          background-color: #1e3a8a;
        }

        .btn-secondary {
          background-color: #e5e7eb;
          color: #333;
        }

        .btn-secondary:hover {
          background-color: #d1d5db;
        }

        .btn-success {
          background-color: #10b981;
          color: white;
        }

        .btn-success:hover {
          background-color: #059669;
        }

        .btn-danger {
          background-color: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background-color: #dc2626;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 12px 15px;
          border-radius: 4px;
          margin-bottom: 15px;
          border-left: 4px solid;
        }

        .message.success {
          background-color: #d1fae5;
          color: #065f46;
          border-left-color: #10b981;
        }

        .message.error {
          background-color: #fee2e2;
          color: #991b1b;
          border-left-color: #ef4444;
        }

        .message.info {
          background-color: #dbeafe;
          color: #0c4a6e;
          border-left-color: #3b82f6;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
          text-transform: uppercase;
        }

        .stat-card.error {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-card.warning {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .stat-card.success {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .table th {
          background-color: #f3f4f6;
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          color: #1f2937;
        }

        .table td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .table tbody tr:hover {
          background-color: #f9fafb;
        }

        .file-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
        }

        .input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .loading {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #1e40af;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <h2>📊 Dashboard de Relatórios e Auditoria</h2>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          ✓ Validação
        </button>
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📄 Relatórios
        </button>
        <button
          className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          🔍 Auditoria
        </button>
        <button
          className={`tab-button ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          💾 Backup
        </button>
      </div>

      <div className="tab-content">
        {/* ==================== VALIDATION TAB ==================== */}
        {activeTab === 'validation' && (
          <div>
            <div className="stats-grid">
              <div className={`stat-card ${validationResult.isValid ? 'success' : 'error'}`}>
                <div className="stat-value">{validationResult.isValid ? '✅' : '❌'}</div>
                <div className="stat-label">Status</div>
              </div>
              <div className={`stat-card error`}>
                <div className="stat-value">{validationResult.errors.length}</div>
                <div className="stat-label">Erros</div>
              </div>
              <div className={`stat-card warning`}>
                <div className="stat-value">{validationResult.warnings.length}</div>
                <div className="stat-label">Avisos</div>
              </div>
              <div className={`stat-card success`}>
                <div className="stat-value">{Object.keys(validationResult.summary.sections).length}</div>
                <div className="stat-label">Seções</div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Ações</div>
              <div className="button-group">
                <button className="btn btn-primary" onClick={handleValidate} disabled={isLoading}>
                  {isLoading && <span className="loading"></span>}
                  Executar Validação
                </button>
                <button className="btn btn-success" onClick={handleVerifyIntegrity} disabled={isLoading}>
                  {isLoading && <span className="loading"></span>}
                  Verificar Integridade
                </button>
                <button className="btn btn-success" onClick={handleRegisterChecksum} disabled={isLoading}>
                  {isLoading && <span className="loading"></span>}
                  Registrar Checksum
                </button>
              </div>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="section">
                <div className="section-title">Erros Encontrados ({validationResult.errors.length})</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Mensagem</th>
                      <th>Seção</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.errors.slice(0, 10).map((error, i) => (
                      <tr key={i}>
                        <td><strong>{error.field}</strong></td>
                        <td>{error.message}</td>
                        <td>{error.section || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="section">
                <div className="section-title">Avisos ({validationResult.warnings.length})</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Mensagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.warnings.slice(0, 5).map((warning, i) => (
                      <tr key={i}>
                        <td><strong>{warning.field}</strong></td>
                        <td>{warning.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== REPORTS TAB ==================== */}
        {activeTab === 'reports' && (
          <div>
            <div className="section">
              <div className="section-title">Gerar Relatórios</div>
              <div className="button-group">
                <button className="btn btn-primary" onClick={handleGenerateReport} disabled={isLoading}>
                  {isLoading && <span className="loading"></span>}
                  📊 Relatório Executivo (HTML)
                </button>
                <button className="btn btn-secondary" onClick={handleDownloadJSON} disabled={isLoading}>
                  📥 Exportar JSON
                </button>
                <button className="btn btn-secondary" onClick={handleDownloadCSV} disabled={isLoading}>
                  📥 Exportar CSV
                </button>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Importar Dados</div>
              <div className="input-group">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  disabled={isLoading}
                  className="file-input"
                />
                <span style={{ fontSize: '12px', color: '#666' }}>Aceita JSON</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== AUDIT TAB ==================== */}
        {activeTab === 'audit' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{auditReport.totalOperations}</div>
                <div className="stat-label">Operações</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{auditReport.summary.createsCount}</div>
                <div className="stat-label">Criações</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{auditReport.summary.updatesCount}</div>
                <div className="stat-label">Alterações</div>
              </div>
              <div className="stat-card error">
                <div className="stat-value">{auditReport.summary.failuresCount}</div>
                <div className="stat-label">Falhas</div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Operações por Tipo</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(auditReport.operationsByType).map(([type, count]) => (
                    <tr key={type}>
                      <td><strong>{type}</strong></td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-title">Downloads</div>
              <div className="button-group">
                <button className="btn btn-secondary" onClick={handleDownloadAuditReport} disabled={isLoading}>
                  📥 Relatório JSON
                </button>
                <button className="btn btn-secondary" onClick={handleDownloadAuditCSV} disabled={isLoading}>
                  📥 Relatório CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== BACKUP TAB ==================== */}
        {activeTab === 'backup' && (
          <div>
            <div className="section">
              <div className="section-title">Backups Disponíveis ({backups.length})</div>
              <div className="button-group">
                <button className="btn btn-success" onClick={handleCreateBackup} disabled={isLoading}>
                  {isLoading && <span className="loading"></span>}
                  ➕ Novo Backup
                </button>
              </div>
            </div>

            {backups.length > 0 && (
              <div className="section">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Checksum</th>
                      <th>Tamanho</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map(backup => (
                      <tr key={backup.id}>
                        <td>{new Date(backup.timestamp).toLocaleString('pt-BR')}</td>
                        <td><code style={{ fontSize: '11px' }}>{backup.checksum.substring(0, 12)}...</code></td>
                        <td>{(backup.size / 1024).toFixed(1)} KB</td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={isLoading}
                            style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                          >
                            Restaurar
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteBackup(backup.id)}
                            disabled={isLoading}
                            style={{ fontSize: '12px', padding: '5px 10px' }}
                          >
                            Deletar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;
