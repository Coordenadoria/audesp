// OCR & Document Processing Services
export { default as OCRService } from './OCRService';
export type { OCRResult, ExtractedField } from './OCRService';

export { default as DocumentClassifier } from './DocumentClassifier';
export type { ClassificationResult, DocumentMetadata } from './DocumentClassifier';

export { default as FieldExtractor } from './FieldExtractor';
export type { FieldMapping, FieldExtractionResult } from './FieldExtractor';

export { default as DocumentLinker } from './DocumentLinker';
export type { DocumentLink, FormRecord } from './DocumentLinker';
