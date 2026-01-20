import { ExtractedField, FieldMapping } from './FieldExtractor';
import { DocumentMetadata } from './DocumentClassifier';

export interface DocumentLink {
  documentId: string;
  linkedFormSection: string;
  linkedFields: Map<string, string>; // Campo AUDESP -> Valor
  linkStrength: number; // 0-1
  requiresReview: boolean;
  notes: string[];
}

export interface FormRecord {
  id: string;
  formType: string; // ex: "Prestação de Contas"
  data: Record<string, any>;
  linkedDocuments: DocumentLink[];
  updatedAt: Date;
}

export class DocumentLinker {
  private static instance: DocumentLinker;
  private linkedDocuments: Map<string, DocumentLink> = new Map();
  private formRecords: Map<string, FormRecord> = new Map();

  private constructor() {}

  static getInstance(): DocumentLinker {
    if (!this.instance) {
      this.instance = new DocumentLinker();
    }
    return this.instance;
  }

  /**
   * Linkar documento com registro de formulário
   */
  linkDocumentToForm(
    documentId: string,
    metadata: DocumentMetadata,
    mappings: FieldMapping[],
    formRecordId: string
  ): DocumentLink {
    const linkedFields = new Map<string, string>();
    let totalConfidence = 0;
    let validMappings = 0;

    // Mapear campos com confiança mínima de 0.7
    mappings.forEach((mapping) => {
      if (mapping.matchConfidence >= 0.7) {
        linkedFields.set(mapping.formField, mapping.extractedField.value);
        totalConfidence += mapping.matchConfidence;
        validMappings++;
      }
    });

    const linkStrength = validMappings > 0 ? totalConfidence / validMappings : 0;
    const requiresReview = linkStrength < 0.85 || metadata.ocrConfidence < 0.7;

    const notes: string[] = [];
    if (requiresReview) {
      notes.push('⚠️ Verificação manual recomendada');
    }
    if (metadata.ocrConfidence < 0.7) {
      notes.push(`📄 Qualidade OCR baixa: ${(metadata.ocrConfidence * 100).toFixed(0)}%`);
    }
    if (mappings.length === 0) {
      notes.push('❌ Nenhum campo foi mapeado automaticamente');
    }

    const link: DocumentLink = {
      documentId,
      linkedFormSection: this.inferFormSection(metadata.documentType),
      linkedFields,
      linkStrength: Math.round(linkStrength * 100) / 100,
      requiresReview,
      notes,
    };

    this.linkedDocuments.set(documentId, link);

    // Adicionar ao registro do formulário
    if (this.formRecords.has(formRecordId)) {
      const record = this.formRecords.get(formRecordId)!;
      record.linkedDocuments.push(link);
      record.updatedAt = new Date();
    }

    return link;
  }

  /**
   * Inferir seção do formulário baseado no tipo de documento
   */
  private inferFormSection(documentType: string): string {
    const sectionMap: Record<string, string> = {
      nf: 'Receitas/NotasFiscais',
      contrato: 'DocumentosSuporte/Contratos',
      comprovante: 'Comprovantes/Pagamentos',
      desconhecido: 'Diversos',
    };

    return sectionMap[documentType] || 'Diversos';
  }

  /**
   * Criar novo registro de formulário
   */
  createFormRecord(id: string, formType: string, initialData: Record<string, any> = {}): FormRecord {
    const record: FormRecord = {
      id,
      formType,
      data: initialData,
      linkedDocuments: [],
      updatedAt: new Date(),
    };

    this.formRecords.set(id, record);
    return record;
  }

  /**
   * Atualizar formulário com dados extraídos de documento
   */
  updateFormWithExtractedData(
    formRecordId: string,
    link: DocumentLink,
    autoApply: boolean = false
  ): {
    updated: boolean;
    changes: Record<string, { old: any; new: any }>;
    conflicts: string[];
  } {
    const changes: Record<string, { old: any; new: any }> = {};
    const conflicts: string[] = [];

    if (!this.formRecords.has(formRecordId)) {
      return { updated: false, changes, conflicts: ['Registro de formulário não encontrado'] };
    }

    const record = this.formRecords.get(formRecordId)!;

    // Verificar conflitos e aplicar mudanças
    link.linkedFields.forEach((value, fieldName) => {
      const existingValue = record.data[fieldName];

      if (existingValue && existingValue !== value) {
        conflicts.push(
          `Campo "${fieldName}": existente="${existingValue}" vs. extraído="${value}"`
        );

        if (autoApply) {
          changes[fieldName] = { old: existingValue, new: value };
          record.data[fieldName] = value;
        }
      } else if (!existingValue) {
        changes[fieldName] = { old: undefined, new: value };
        record.data[fieldName] = value;
      }
    });

    record.updatedAt = new Date();

    return {
      updated: Object.keys(changes).length > 0,
      changes,
      conflicts,
    };
  }

  /**
   * Obter todos os documentos linkados a um formulário
   */
  getLinkedDocuments(formRecordId: string): DocumentLink[] {
    const record = this.formRecords.get(formRecordId);
    return record ? record.linkedDocuments : [];
  }

  /**
   * Remover link de documento
   */
  unlinkDocument(documentId: string, formRecordId: string): boolean {
    const link = this.linkedDocuments.get(documentId);
    if (!link) return false;

    const record = this.formRecords.get(formRecordId);
    if (!record) return false;

    const index = record.linkedDocuments.indexOf(link);
    if (index > -1) {
      record.linkedDocuments.splice(index, 1);
      this.linkedDocuments.delete(documentId);
      return true;
    }

    return false;
  }

  /**
   * Gerar sumário de links
   */
  generateLinkSummary(formRecordId: string): string {
    const record = this.formRecords.get(formRecordId);
    if (!record) return 'Registro não encontrado';

    let summary = `📎 RESUMO DE DOCUMENTOS LINKADOS (${record.id})\n`;
    summary += '='.repeat(50) + '\n\n';

    if (record.linkedDocuments.length === 0) {
      summary += 'Nenhum documento linkado.\n';
      return summary;
    }

    let totalConfidence = 0;
    record.linkedDocuments.forEach((link, index) => {
      summary += `${index + 1}. ${link.documentId}\n`;
      summary += `   📍 Seção: ${link.linkedFormSection}\n`;
      summary += `   📊 Confiança: ${(link.linkStrength * 100).toFixed(0)}%\n`;
      summary += `   🔗 Campos: ${link.linkedFields.size}\n`;

      if (link.requiresReview) {
        summary += `   ⚠️  Requer Revisão\n`;
      }

      if (link.notes.length > 0) {
        link.notes.forEach((note) => {
          summary += `      ${note}\n`;
        });
      }

      totalConfidence += link.linkStrength;
      summary += '\n';
    });

    const avgConfidence = totalConfidence / record.linkedDocuments.length;
    summary += `\n📊 Confiança Média: ${(avgConfidence * 100).toFixed(0)}%\n`;
    summary += `⚠️  Requerem Revisão: ${record.linkedDocuments.filter((d) => d.requiresReview).length}\n`;

    return summary;
  }

  /**
   * Validar integridade dos links
   */
  validateLinks(formRecordId: string): {
    isValid: boolean;
    issues: string[];
  } {
    const record = this.formRecords.get(formRecordId);
    if (!record) {
      return { isValid: false, issues: ['Registro não encontrado'] };
    }

    const issues: string[] = [];

    record.linkedDocuments.forEach((link) => {
      if (link.linkStrength < 0.5) {
        issues.push(
          `Link fraco detectado: ${link.documentId} (confiança: ${link.linkStrength})`
        );
      }

      if (link.linkedFields.size === 0) {
        issues.push(`Link sem campos mapeados: ${link.documentId}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Exportar dados linkados para arquivo
   */
  exportLinkedData(formRecordId: string): Record<string, any> {
    const record = this.formRecords.get(formRecordId);
    if (!record) return {};

    return {
      formRecord: {
        id: record.id,
        formType: record.formType,
        data: record.data,
        updatedAt: record.updatedAt.toISOString(),
      },
      linkedDocuments: record.linkedDocuments.map((link) => ({
        documentId: link.documentId,
        section: link.linkedFormSection,
        fields: Object.fromEntries(link.linkedFields),
        strength: link.linkStrength,
        requiresReview: link.requiresReview,
        notes: link.notes,
      })),
    };
  }

  /**
   * Importar dados linkados de arquivo
   */
  importLinkedData(data: Record<string, any>, formRecordId: string): boolean {
    try {
      if (data.formRecord) {
        const record = this.createFormRecord(
          formRecordId,
          data.formRecord.formType,
          data.formRecord.data
        );
        record.updatedAt = new Date(data.formRecord.updatedAt);
      }

      if (data.linkedDocuments && Array.isArray(data.linkedDocuments)) {
        const record = this.formRecords.get(formRecordId);
        if (record) {
          data.linkedDocuments.forEach((linkData: any) => {
            const link: DocumentLink = {
              documentId: linkData.documentId,
              linkedFormSection: linkData.section,
              linkedFields: new Map(Object.entries(linkData.fields || {})),
              linkStrength: linkData.strength || 0,
              requiresReview: linkData.requiresReview || false,
              notes: linkData.notes || [],
            };
            record.linkedDocuments.push(link);
            this.linkedDocuments.set(linkData.documentId, link);
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }
}

export default DocumentLinker.getInstance();
