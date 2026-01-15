/**
 * EXEMPLO DE INTEGRAÇÃO DO PDFUploader
 * 
 * Este arquivo mostra como integrar o PDFUploader em qualquer seção do formulário.
 * 
 * COPIE E ADAPTE para suas seções!
 */

import React, { useState } from 'react';
import { PDFUploader } from '../components/PDFUploader';
import { ExtractedData } from '../services/ocrService';

/**
 * EXEMPLO 1: Seção de Dados Gerais da Entidade
 */
export const DadosGeraisSectionComPDF = ({ data, onUpdate }: any) => {
  const [uploadedData, setUploadedData] = useState<any>(null);

  const handlePDFExtracted = (extracted: ExtractedData, mappedData: Partial<any>) => {
    // Salvar dados extraídos
    setUploadedData(extracted);

    // Atualizar formulário com os dados extraídos
    if (extracted.cnpj) {
      onUpdate('cnpj', extracted.cnpj);
    }
    if (extracted.razao_social) {
      onUpdate('razao_social', extracted.razao_social);
    }
    if (extracted.municipio) {
      onUpdate('municipio', extracted.municipio);
    }

    // Mostrar notificação de sucesso
    console.log('✓ Dados do PDF carregados e formulário preenchido!');
  };

  const handleError = (error: string) => {
    console.error('Erro ao carregar PDF:', error);
    // Mostrar notificação de erro para o usuário
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Dados da Entidade</h3>

      {/* Seção de Upload PDF */}
      <PDFUploader
        sectionType="dados_gerais"
        label="Carregar PDF do Estatuto/Documento da Entidade"
        onDataExtracted={handlePDFExtracted}
        onError={handleError}
      />

      {/* Dados extraídos do PDF */}
      {uploadedData && (
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            Dados extraídos do PDF:
          </p>
          {uploadedData.cnpj && (
            <p className="text-sm text-blue-800">CNPJ: {uploadedData.cnpj}</p>
          )}
          {uploadedData.razao_social && (
            <p className="text-sm text-blue-800">Razão Social: {uploadedData.razao_social}</p>
          )}
        </div>
      )}

      {/* Campos normais do formulário */}
      <div>
        <label className="block text-sm font-medium mb-2">CNPJ *</label>
        <input
          type="text"
          value={data.cnpj || ''}
          onChange={(e) => onUpdate('cnpj', e.target.value)}
          placeholder="00.000.000/0000-00"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Razão Social *</label>
        <input
          type="text"
          value={data.razao_social || ''}
          onChange={(e) => onUpdate('razao_social', e.target.value)}
          placeholder="Nome da entidade"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* ... outros campos ... */}
    </div>
  );
};

/**
 * EXEMPLO 2: Seção de Documentos Fiscais
 */
export const DocumentosFiscaisSectionComPDF = ({ data, onUpdate }: any) => {
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  const handlePDFExtracted = (extracted: ExtractedData, mappedData: Partial<any>) => {
    // Extrair documentos fiscais do PDF
    if (extracted.documentos_fiscais) {
      setUploadedDocs(extracted.documentos_fiscais);

      // Adicionar ao formulário
      const novosDocumentos = (data.documentos_fiscais || []).concat(
        extracted.documentos_fiscais.map((doc: string) => ({
          numero: doc,
          descricao: `Importado de: ${doc}`
        }))
      );

      onUpdate('documentos_fiscais', novosDocumentos);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Documentos Fiscais</h3>

      {/* Upload PDF de NFs */}
      <PDFUploader
        sectionType="documentos_fiscais"
        label="Carregar PDF com Notas Fiscais"
        onDataExtracted={handlePDFExtracted}
        onError={(err) => console.error(err)}
      />

      {/* Lista de documentos extraídos */}
      {uploadedDocs.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-green-900 mb-2">
            {uploadedDocs.length} Documento(s) importado(s):
          </p>
          <ul className="space-y-1">
            {uploadedDocs.map((doc, idx) => (
              <li key={idx} className="text-sm text-green-800">
                • {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabela de documentos */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left">Número</th>
              <th className="px-4 py-2 text-left">Descrição</th>
              <th className="px-4 py-2">Ação</th>
            </tr>
          </thead>
          <tbody>
            {(data.documentos_fiscais || []).map((doc: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{doc.numero}</td>
                <td className="px-4 py-2">{doc.descricao}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => {
                      const novos = data.documentos_fiscais.filter((_: any, i: number) => i !== idx);
                      onUpdate('documentos_fiscais', novos);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * EXEMPLO 3: Seção de Receitas
 */
export const ReceitasSectionComPDF = ({ data, onUpdate }: any) => {
  const handlePDFExtracted = (extracted: ExtractedData, mappedData: Partial<any>) => {
    // Extrair valores de receitas
    if (extracted.valores?.repasses) {
      onUpdate('repasses_recebidos', extracted.valores.repasses);
    }
    if (extracted.valores?.receitas) {
      onUpdate('receitas', extracted.valores.receitas);
    }
    if (extracted.datas) {
      onUpdate('periodo_data_inicial', extracted.datas[0]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Receitas</h3>

      {/* Upload PDF de Extrato/Folha de Receitas */}
      <PDFUploader
        sectionType="receitas"
        label="Carregar PDF com Movimentação de Receitas"
        onDataExtracted={handlePDFExtracted}
        onError={(err) => console.error(err)}
      />

      {/* Campos de receitas */}
      <div>
        <label className="block text-sm font-medium mb-2">Repasses Recebidos</label>
        <input
          type="number"
          value={data.repasses_recebidos || 0}
          onChange={(e) => onUpdate('repasses_recebidos', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Outras Receitas</label>
        <input
          type="number"
          value={data.receitas || 0}
          onChange={(e) => onUpdate('receitas', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    </div>
  );
};

/**
 * COMO USAR:
 * 
 * 1. Importe o componente PDFUploader onde precisar:
 *    import { PDFUploader } from './components/PDFUploader';
 * 
 * 2. Adicione em qualquer seção do formulário:
 *    <PDFUploader
 *      sectionType="sua_secao"
 *      label="Carregar PDF"
 *      onDataExtracted={handlePDFExtracted}
 *      onError={handleError}
 *    />
 * 
 * 3. Implemente os handlers:
 *    const handlePDFExtracted = (extracted, mapped) => {
 *      // Usar extracted para obter os dados
 *      // Use onUpdate para atualizar o formulário
 *    };
 * 
 * 4. Os dados do PDF serão automaticamente:
 *    ✓ Extraídos usando OCR
 *    ✓ Validados com detecção de padrões
 *    ✓ Mapeados para o formulário
 *    ✓ Preenchidos nos campos
 */
