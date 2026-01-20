import React, { useState, useCallback } from 'react';
import PrestacaoContasForm from '../components/PrestacaoContasForm';

/**
 * EXEMPLO DE INTEGRAÇÃO COM BACKEND
 * 
 * Este arquivo mostra como integrar o formulário PrestacaoContasForm
 * com um backend TypeORM que salva os dados no banco de dados.
 */

interface FormState {
  descritor?: { exercicio?: string; orgao?: string; tipoAjuste?: string; periodo?: string };
  codigoAjuste?: string;
  retificacao?: boolean;
  relacaoEmpregados?: Array<any>;
  relacaoBens?: { bensMoveis?: Array<any>; bensImoveis?: Array<any> };
  contratos?: Array<any>;
  documentosFiscais?: Array<any>;
  pagamentos?: Array<any>;
  disponibilidades?: { saldoBancario?: number; aplicacoes?: number; contaBancaria?: string };
  receitas?: { repasses?: number; rendimentos?: number; contrapartidas?: number };
  ajustesSaldo?: { diferencas?: number; correcoes?: number; conciliacoes?: string };
  servidoresCedidos?: Array<any>;
  descontos?: Array<any>;
  devolucoes?: Array<any>;
  glosas?: Array<any>;
  empenhos?: Array<any>;
  repasses?: Array<any>;
  relatorioAtividades?: { resumoExecutivo?: string; resultadosFisicos?: string; impactos?: string };
  dadosGeraiseEntidadeBeneficiaria?: { razaoSocial?: string; cnpj?: string; endereco?: string; responsavel?: string };
  responsaveisMembrosOrgaoConcedente?: { nomes?: string[]; assinantes?: string[]; data?: string };
  declaracoes?: { declaracaoCompletude?: boolean; declaracaoLegalidade?: boolean; declaracaoRegularidade?: boolean; observacoes?: string };
  relatorioGovernamentalAnaliseExecucao?: { analiseFinanceira?: string; analiseOperacional?: string; recomendacoes?: string };
  demonstracoesContabeis?: { balancePatrimonial?: string; demonstracaoResultado?: string; fluxoCaixa?: string };
  publicacoesParecerAta?: Array<any>;
  prestacaoContasEntidadeBeneficiaria?: { consolidacao?: string; observacoes?: string };
  parecerConclusivo?: { parecer?: string; conclusao?: string; data?: string };
  transparencia?: { links?: string[]; portais?: string[]; dataPublicacao?: string };
}

// ============================================================================
// SERVIÇOS DE BACKEND
// ============================================================================

/**
 * Salva a prestação de contas no backend
 */
export const savePrestacaoToBackend = async (data: FormState): Promise<{ id: string; success: boolean }> => {
  const token = localStorage.getItem('authToken');

  const response = await fetch('/api/prestacao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Erro ao salvar: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Carrega prestação de contas existente
 */
export const loadPrestacaoFromBackend = async (id: string): Promise<FormState> => {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`/api/prestacao/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar');
  }

  return response.json();
};

/**
 * Atualiza prestação existente
 */
export const updatePrestacaoBackend = async (id: string, data: FormState): Promise<{ success: boolean }> => {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`/api/prestacao/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar');
  }

  return response.json();
};

/**
 * Valida a prestação no backend
 */
export const validatePrestacaoBackend = async (data: FormState): Promise<{ valid: boolean; errors: string[] }> => {
  const response = await fetch('/api/prestacao/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return response.json();
};

/**
 * Exporta prestação como PDF
 */
export const exportPrestacaoToPDF = async (id: string): Promise<Blob> => {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`/api/prestacao/${id}/export-pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao exportar PDF');
  }

  return response.blob();
};

// ============================================================================
// COMPONENTE WRAPPER COM INTEGRAÇÃO
// ============================================================================

interface PrestacaoContasPageProps {
  prestacaoId?: string; // Se vazio, cria nova. Se preenchido, carrega existente
}

export const PrestacaoContasPage: React.FC<PrestacaoContasPageProps> = ({ prestacaoId }) => {
  const [formData, setFormData] = useState<FormState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Carregar prestação existente ao montar componente
  React.useEffect(() => {
    if (prestacaoId) {
      loadPrestacaoFromBackend(prestacaoId)
        .then(setFormData)
        .catch(err => setError(err.message));
    }
  }, [prestacaoId]);

  // Auto-save a cada 30 segundos
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        handleAutoSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData]);

  const handleAutoSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      if (prestacaoId) {
        await updatePrestacaoBackend(prestacaoId, formData);
      } else {
        const result = await savePrestacaoToBackend(formData);
        // Atualizar URL com novo ID (opcional)
        window.history.replaceState({}, '', `/prestacao/${result.id}`);
      }

      setLastSaved(new Date().toLocaleTimeString('pt-BR'));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [formData, prestacaoId]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Validar primeiro
      const validation = await validatePrestacaoBackend(formData);
      
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        setError('Existem erros de validação. Veja abaixo.');
        setIsSaving(false);
        return;
      }

      // Se válido, salvar
      if (prestacaoId) {
        await updatePrestacaoBackend(prestacaoId, formData);
      } else {
        const result = await savePrestacaoToBackend(formData);
        window.history.replaceState({}, '', `/prestacao/${result.id}`);
      }

      setLastSaved(new Date().toLocaleTimeString('pt-BR'));
      setError(null);
      setValidationErrors([]);
      alert('Prestação salva com sucesso!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [formData, prestacaoId]);

  const handleExportPDF = useCallback(async () => {
    if (!prestacaoId) {
      alert('Salve a prestação primeiro antes de exportar');
      return;
    }

    try {
      const blob = await exportPrestacaoToPDF(prestacaoId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prestacao_${prestacaoId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  }, [prestacaoId]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {prestacaoId ? `Prestação #${prestacaoId}` : 'Nova Prestação de Contas'}
          </h1>
          {lastSaved && (
            <p className="text-xs text-slate-500 mt-1">
              Salvo em: {lastSaved}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAutoSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-slate-500 text-white rounded hover:bg-slate-600 disabled:bg-slate-400"
          >
            {isSaving ? 'Salvando...' : 'Auto-save'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSaving ? 'Salvando...' : 'Salvar Agora'}
          </button>
          {prestacaoId && (
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="m-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <p className="font-medium">{error}</p>
          {validationErrors.length > 0 && (
            <ul className="mt-2 ml-4 list-disc text-sm">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Form */}
      <div className="p-4">
        <PrestacaoContasForm />
      </div>
    </div>
  );
};

export default PrestacaoContasPage;

// ============================================================================
// ENDPOINTS BACKEND ESPERADOS (Node.js/Express + TypeORM)
// ============================================================================

/**
POST /api/prestacao
Body: FormState (JSON)
Returns: { id: string, success: boolean }
Auth: Required

GET /api/prestacao/:id
Returns: FormState (JSON)
Auth: Required

PUT /api/prestacao/:id
Body: FormState (JSON)
Returns: { success: boolean }
Auth: Required

POST /api/prestacao/validate
Body: FormState (JSON)
Returns: { valid: boolean, errors: string[] }
Auth: Optional

GET /api/prestacao/:id/export-pdf
Returns: PDF Blob
Auth: Required
*/

// ============================================================================
// EXEMPLO DE IMPLEMENTATION NO BACKEND (TypeORM)
// ============================================================================

/**
// backend/src/controllers/prestacao.controller.ts

import { Request, Response } from 'express';
import { Prestacao } from '../entities/Prestacao';
import { AppDataSource } from '../config/database';

export class PrestacaoController {
  // POST /api/prestacao
  static async create(req: Request, res: Response) {
    try {
      const prestacaoRepo = AppDataSource.getRepository(Prestacao);
      
      const prestacao = prestacaoRepo.create({
        ...req.body,
        userId: req.userId // Vem do JWT middleware
      });

      await prestacaoRepo.save(prestacao);

      res.json({ id: prestacao.id, success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // GET /api/prestacao/:id
  static async getById(req: Request, res: Response) {
    try {
      const prestacao = await AppDataSource.getRepository(Prestacao).findOne({
        where: { id: req.params.id, userId: req.userId }
      });

      if (!prestacao) {
        return res.status(404).json({ error: 'Prestação não encontrada' });
      }

      res.json(prestacao);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /api/prestacao/:id
  static async update(req: Request, res: Response) {
    try {
      const prestacaoRepo = AppDataSource.getRepository(Prestacao);
      
      await prestacaoRepo.update(
        { id: req.params.id, userId: req.userId },
        req.body
      );

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
*/
