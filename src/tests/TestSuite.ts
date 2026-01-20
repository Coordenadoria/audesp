/**
 * TestSuite - Suite de testes para AUDESP
 */

export interface TestCase {
  id: string;
  name: string;
  description: string;
  test: () => Promise<void> | void;
  expectedResult: string;
  tags: string[];
}

export interface TestResult {
  testId: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  error?: string;
  message?: string;
}

export class TestSuite {
  private static instance: TestSuite;
  private tests: Map<string, TestCase> = new Map();
  private results: TestResult[] = [];
  private beforeHooks: Array<() => Promise<void> | void> = [];
  private afterHooks: Array<() => Promise<void> | void> = [];

  private constructor() {}

  static getInstance(): TestSuite {
    if (!this.instance) {
      this.instance = new TestSuite();
    }
    return this.instance;
  }

  /**
   * Registrar caso de teste
   */
  register(testCase: TestCase): void {
    this.tests.set(testCase.id, testCase);
  }

  /**
   * Registrar hook before
   */
  before(hook: () => Promise<void> | void): void {
    this.beforeHooks.push(hook);
  }

  /**
   * Registrar hook after
   */
  after(hook: () => Promise<void> | void): void {
    this.afterHooks.push(hook);
  }

  /**
   * Executar todos os testes
   */
  async runAll(): Promise<TestResult[]> {
    this.results = [];

    for (const [, testCase] of this.tests) {
      const result = await this.runTest(testCase);
      this.results.push(result);
    }

    return this.results;
  }

  /**
   * Executar testes por tag
   */
  async runByTag(tag: string): Promise<TestResult[]> {
    this.results = [];

    for (const [, testCase] of this.tests) {
      if (testCase.tags.includes(tag)) {
        const result = await this.runTest(testCase);
        this.results.push(result);
      }
    }

    return this.results;
  }

  /**
   * Executar teste individual
   */
  private async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    let status: 'passed' | 'failed' | 'skipped' | 'error' = 'passed';
    let error: string | undefined;
    let message: string | undefined;

    try {
      // Executar before hooks
      for (const hook of this.beforeHooks) {
        await Promise.resolve(hook());
      }

      // Executar teste
      await Promise.resolve(testCase.test());
      message = testCase.expectedResult;
    } catch (e) {
      status = 'error';
      error = e instanceof Error ? e.message : String(e);
    } finally {
      // Executar after hooks
      for (const hook of this.afterHooks) {
        await Promise.resolve(hook());
      }
    }

    const duration = Date.now() - startTime;

    return {
      testId: testCase.id,
      name: testCase.name,
      status,
      duration,
      error,
      message,
    };
  }

  /**
   * Obter resultados
   */
  getResults(): TestResult[] {
    return this.results;
  }

  /**
   * Gerar relatório
   */
  generateReport(): string {
    const passed = this.results.filter((r) => r.status === 'passed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;
    const errors = this.results.filter((r) => r.status === 'error').length;
    const skipped = this.results.filter((r) => r.status === 'skipped').length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    let report = '📊 RELATÓRIO DE TESTES AUDESP\n';
    report += '='.repeat(60) + '\n\n';

    report += `Total: ${total}\n`;
    report += `✅ Passou: ${passed} (${((passed / total) * 100).toFixed(1)}%)\n`;
    report += `❌ Falhou: ${failed}\n`;
    report += `🚫 Erro: ${errors}\n`;
    report += `⏭️  Pulado: ${skipped}\n`;
    report += `⏱️  Tempo Total: ${totalDuration}ms\n\n`;

    report += 'DETALHES:\n';
    report += '-'.repeat(60) + '\n';

    this.results.forEach((result) => {
      const icon =
        result.status === 'passed'
          ? '✅'
          : result.status === 'failed'
            ? '❌'
            : result.status === 'error'
              ? '🚫'
              : '⏭️';

      report += `${icon} ${result.name}\n`;
      report += `   Tempo: ${result.duration}ms\n`;

      if (result.error) {
        report += `   Erro: ${result.error}\n`;
      }
      if (result.message) {
        report += `   Resultado: ${result.message}\n`;
      }
    });

    return report;
  }

  /**
   * Assert que um valor é verdadeiro
   */
  static assert(condition: boolean, message: string = 'Assertion failed'): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Assert que dois valores são iguais
   */
  static assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  /**
   * Assert que um valor está no array
   */
  static assertIncludes<T>(array: T[], item: T, message?: string): void {
    if (!array.includes(item)) {
      throw new Error(message || `Array does not include ${item}`);
    }
  }

  /**
   * Assert que uma função lança erro
   */
  static async assertThrows(
    fn: () => Promise<void> | void,
    message?: string
  ): Promise<void> {
    try {
      await Promise.resolve(fn());
      throw new Error(message || 'Expected function to throw');
    } catch (e) {
      if (e instanceof Error && e.message === (message || 'Expected function to throw')) {
        throw e;
      }
      // Erro esperado
    }
  }
}

export default TestSuite.getInstance();
