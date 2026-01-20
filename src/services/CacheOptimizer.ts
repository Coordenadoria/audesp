/**
 * CacheOptimizer - Otimização de cache para produção
 */

export interface CacheConfig {
  ttl: number; // Time To Live em segundos
  maxSize: number; // Tamanho máximo em bytes
  strategy: 'LRU' | 'LFU' | 'FIFO'; // Estratégia de remoção
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  hits: number;
  createdAt: Date;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entries: number;
}

export class CacheOptimizer {
  private static instance: CacheOptimizer;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig = {
    ttl: 3600, // 1 hora padrão
    maxSize: 50 * 1024 * 1024, // 50MB padrão
    strategy: 'LRU',
  };
  private stats = {
    hits: 0,
    misses: 0,
  };

  private constructor() {
    this.initializePersistentCache();
  }

  static getInstance(): CacheOptimizer {
    if (!this.instance) {
      this.instance = new CacheOptimizer();
    }
    return this.instance;
  }

  /**
   * Inicializar cache persistente (LocalStorage)
   */
  private initializePersistentCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cachedData = localStorage.getItem('audesp_cache_index');
      if (cachedData) {
        const index = JSON.parse(cachedData);
        Object.keys(index).forEach((key) => {
          const stored = localStorage.getItem(`audesp_cache_${key}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            this.cache.set(key, parsed);
          }
        });
        console.log(`Cache restored with ${this.cache.size} entries`);
      }
    } catch (error) {
      console.warn('Failed to restore cache from localStorage:', error);
    }
  }

  /**
   * Configurar cache
   */
  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Cache configured:', this.config);
  }

  /**
   * Adicionar item ao cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Limpar se necessário
    this.ensureSpace(JSON.stringify(value).length);

    const expiresAt = Date.now() + ((ttl || this.config.ttl) * 1000);
    const size = JSON.stringify(value).length;

    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt,
      hits: 0,
      createdAt: new Date(),
      size,
    };

    this.cache.set(key, entry);

    // Persistir em localStorage se disponível
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`audesp_cache_${key}`, JSON.stringify(entry));
        this.updateCacheIndex();
      } catch (error) {
        console.warn('Failed to persist cache entry:', error);
      }
    }

    console.log(`Cache SET: ${key} (TTL: ${ttl || this.config.ttl}s)`);
  }

  /**
   * Obter item do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar se expirou
    if (entry.expiresAt < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;

    console.log(`Cache HIT: ${key} (hits: ${entry.hits})`);
    return entry.value as T;
  }

  /**
   * Verificar se existe chave no cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) return false;

    if (entry.expiresAt < Date.now()) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Deletar item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);

    if (deleted && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`audesp_cache_${key}`);
        this.updateCacheIndex();
      } catch (error) {
        console.warn('Failed to delete cache entry from localStorage:', error);
      }
    }

    return deleted;
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };

    if (typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem('audesp_cache_index');
        if (cachedData) {
          const index = JSON.parse(cachedData);
          Object.keys(index).forEach((key) => {
            localStorage.removeItem(`audesp_cache_${key}`);
          });
          localStorage.removeItem('audesp_cache_index');
        }
      } catch (error) {
        console.warn('Failed to clear localStorage cache:', error);
      }
    }

    console.log('Cache cleared');
  }

  /**
   * Garantir espaço disponível
   */
  private ensureSpace(requiredSize: number): void {
    let currentSize = this.getTotalSize();

    if (currentSize + requiredSize > this.config.maxSize) {
      this.evictEntries(requiredSize);
    }
  }

  /**
   * Remover entradas baseado na estratégia
   */
  private evictEntries(requiredSize: number): void {
    let freedSize = 0;
    const entriesToEvict = this.getEntriesToEvict();

    for (const entry of entriesToEvict) {
      this.delete(entry.key);
      freedSize += entry.size;

      if (freedSize >= requiredSize) break;
    }

    console.log(`Evicted ${entriesToEvict.length} cache entries (freed ${freedSize} bytes)`);
  }

  /**
   * Obter entradas para remoção baseado na estratégia
   */
  private getEntriesToEvict(): CacheEntry<any>[] {
    const entries = Array.from(this.cache.values());

    // Remover expiradas primeiro
    const expired = entries.filter((e) => e.expiresAt < Date.now());
    if (expired.length > 0) {
      return expired;
    }

    switch (this.config.strategy) {
      case 'LRU': // Least Recently Used
        return entries.sort((a, b) => a.hits - b.hits).slice(0, Math.ceil(entries.length * 0.1));

      case 'LFU': // Least Frequently Used
        return entries.sort((a, b) => a.hits - b.hits).slice(0, Math.ceil(entries.length * 0.1));

      case 'FIFO': // First In First Out
        return entries.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        ).slice(0, Math.ceil(entries.length * 0.1));

      default:
        return entries.slice(0, 1);
    }
  }

  /**
   * Obter tamanho total do cache
   */
  private getTotalSize(): number {
    return Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
  }

  /**
   * Obter estatísticas
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalSize: this.getTotalSize(),
      entries: this.cache.size,
    };
  }

  /**
   * Gerar relatório de cache
   */
  generateCacheReport(): string {
    const stats = this.getStats();
    const entries = Array.from(this.cache.values());
    const topEntries = entries.sort((a, b) => b.hits - a.hits).slice(0, 10);

    let report = '💾 RELATÓRIO DE CACHE\n';
    report += '='.repeat(70) + '\n\n';

    report += 'ESTATÍSTICAS:\n';
    report += '-'.repeat(70) + '\n';
    report += `Total de Entradas: ${stats.entries}\n`;
    report += `Tamanho Total: ${this.formatBytes(stats.totalSize)}\n`;
    report += `Cache Hits: ${stats.hits}\n`;
    report += `Cache Misses: ${stats.misses}\n`;
    report += `Taxa de Acerto: ${stats.hitRate}%\n`;
    report += `Estratégia: ${this.config.strategy}\n`;
    report += `TTL Padrão: ${this.config.ttl}s\n\n`;

    report += 'TOP 10 ENTRADAS MAIS ACESSADAS:\n';
    report += '-'.repeat(70) + '\n';
    topEntries.forEach((entry, idx) => {
      report += `${idx + 1}. ${entry.key}\n`;
      report += `   Acessos: ${entry.hits}\n`;
      report += `   Tamanho: ${this.formatBytes(entry.size)}\n`;
      report += `   Criado: ${entry.createdAt.toLocaleString('pt-BR')}\n`;
      report += `   Expira: ${new Date(entry.expiresAt).toLocaleString('pt-BR')}\n`;
    });

    return report;
  }

  /**
   * Atualizar índice de cache no localStorage
   */
  private updateCacheIndex(): void {
    if (typeof window === 'undefined') return;

    try {
      const index: Record<string, boolean> = {};
      this.cache.forEach((_, key) => {
        index[key] = true;
      });
      localStorage.setItem('audesp_cache_index', JSON.stringify(index));
    } catch (error) {
      console.warn('Failed to update cache index:', error);
    }
  }

  /**
   * Formatador de bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default CacheOptimizer.getInstance();
