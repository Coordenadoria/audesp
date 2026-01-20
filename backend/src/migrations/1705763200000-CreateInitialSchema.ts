// backend/src/migrations/1705763200000-CreateInitialSchema.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInitialSchema1705763200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'password', type: 'varchar' },
          { name: 'nome', type: 'varchar' },
          { name: 'cpf', type: 'varchar', isNullable: true, isUnique: true },
          { name: 'cnpj', type: 'varchar', isNullable: true, isUnique: true },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'gestor', 'auditor', 'viewer'],
            default: "'viewer'",
          },
          { name: 'ativo', type: 'boolean', default: true },
          { name: 'ultimoLogin', type: 'timestamp', isNullable: true },
          { name: 'telefone', type: 'varchar', isNullable: true },
          { name: 'criadoEm', type: 'timestamp', default: 'now()' },
          { name: 'atualizadoEm', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Create prestacoes table
    await queryRunner.createTable(
      new Table({
        name: 'prestacoes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'numero', type: 'varchar' },
          { name: 'competencia', type: 'varchar' }, // YYYY-MM
          {
            name: 'status',
            type: 'enum',
            enum: ['rascunho', 'enviada', 'em_analise', 'aprovada', 'rejeitada', 'pendente_correcao'],
            default: "'rascunho'",
          },
          { name: 'nomeGestor', type: 'varchar', isNullable: true },
          { name: 'cpfGestor', type: 'varchar', isNullable: true },
          { name: 'nomeResponsavelPrincipal', type: 'varchar', isNullable: true },
          { name: 'cpfResponsavelPrincipal', type: 'varchar', isNullable: true },
          { name: 'nomeOrgaoOrigem', type: 'varchar', isNullable: true },
          { name: 'codigoOrgaoOrigem', type: 'varchar', isNullable: true },
          { name: 'saldoInicial', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'saldoFinal', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'totalReceitas', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'totalDespesas', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'totalPagamentos', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'possuiDadosPessoais', type: 'boolean', default: false },
          { name: 'consentimentoLGPD', type: 'boolean', default: false },
          { name: 'dataConsentimentoLGPD', type: 'timestamp', isNullable: true },
          { name: 'validado', type: 'boolean', default: false },
          { name: 'dataValidacao', type: 'timestamp', isNullable: true },
          { name: 'validacaoErros', type: 'text', isNullable: true },
          { name: 'validacaoAvisos', type: 'text', isNullable: true },
          { name: 'observacoes', type: 'text', isNullable: true },
          { name: 'metadados', type: 'jsonb', isNullable: true },
          { name: 'criadoEm', type: 'timestamp', default: 'now()' },
          { name: 'atualizadoEm', type: 'timestamp', default: 'now()' },
          { name: 'usuarioCriadorId', type: 'uuid' },
        ],
      }),
      true,
    );

    // Create documentos_fiscais table
    await queryRunner.createTable(
      new Table({
        name: 'documentos_fiscais',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'numero', type: 'varchar' },
          { name: 'serie', type: 'varchar' },
          { name: 'tipo', type: 'enum', enum: ['REC', 'DES', 'ORC'] },
          { name: 'data', type: 'timestamp' },
          { name: 'valor', type: 'numeric', precision: 15, scale: 2 },
          { name: 'descricao', type: 'text', isNullable: true },
          { name: 'fornecedor', type: 'varchar', isNullable: true },
          { name: 'cnpjFornecedor', type: 'varchar', isNullable: true },
          { name: 'contaContabil', type: 'varchar', isNullable: true },
          { name: 'itens', type: 'jsonb', isNullable: true },
          { name: 'caminhoArquivo', type: 'varchar', isNullable: true },
          { name: 'hashArquivo', type: 'varchar', isNullable: true },
          { name: 'validado', type: 'boolean', default: false },
          { name: 'observacoes', type: 'text', isNullable: true },
          { name: 'criadoEm', type: 'timestamp', default: 'now()' },
          { name: 'atualizadoEm', type: 'timestamp', default: 'now()' },
          { name: 'prestacaoId', type: 'uuid' },
        ],
      }),
      true,
    );

    // Create pagamentos table
    await queryRunner.createTable(
      new Table({
        name: 'pagamentos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'numero', type: 'varchar' },
          {
            name: 'status',
            type: 'enum',
            enum: ['pendente', 'processando', 'pago', 'rejeitado', 'devolvido'],
            default: "'pendente'",
          },
          { name: 'valor', type: 'numeric', precision: 15, scale: 2 },
          { name: 'dataPagamento', type: 'timestamp' },
          { name: 'dataProcessamento', type: 'timestamp', isNullable: true },
          { name: 'descricao', type: 'text', isNullable: true },
          { name: 'beneficiario', type: 'varchar', isNullable: true },
          { name: 'cpfCnpjBeneficiario', type: 'varchar', isNullable: true },
          { name: 'contaBancaria', type: 'varchar', isNullable: true },
          { name: 'agenciaBancaria', type: 'varchar', isNullable: true },
          { name: 'bancoId', type: 'varchar', isNullable: true },
          { name: 'numeroDocumento', type: 'varchar', isNullable: true },
          { name: 'ordenacao', type: 'varchar', isNullable: true },
          { name: 'comprovantes', type: 'jsonb', isNullable: true },
          { name: 'validado', type: 'boolean', default: false },
          { name: 'observacoes', type: 'text', isNullable: true },
          { name: 'criadoEm', type: 'timestamp', default: 'now()' },
          { name: 'atualizadoEm', type: 'timestamp', default: 'now()' },
          { name: 'prestacaoId', type: 'uuid' },
        ],
      }),
      true,
    );

    // Create responsaveis table
    await queryRunner.createTable(
      new Table({
        name: 'responsaveis',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'nome', type: 'varchar' },
          { name: 'cpf', type: 'varchar' },
          {
            name: 'tipo',
            type: 'enum',
            enum: ['gestor', 'tesoureiro', 'contador', 'ordenador', 'outro'],
          },
          { name: 'cargo', type: 'varchar' },
          { name: 'email', type: 'varchar', isNullable: true },
          { name: 'telefone', type: 'varchar', isNullable: true },
          { name: 'dataInicio', type: 'timestamp' },
          { name: 'dataFim', type: 'timestamp', isNullable: true },
          { name: 'consentimentoLGPD', type: 'boolean', default: false },
          { name: 'dataConsentimento', type: 'timestamp', isNullable: true },
          { name: 'ativo', type: 'boolean', default: true },
          { name: 'observacoes', type: 'text', isNullable: true },
          { name: 'criadoEm', type: 'timestamp', default: 'now()' },
          { name: 'atualizadoEm', type: 'timestamp', default: 'now()' },
          { name: 'prestacaoId', type: 'uuid' },
        ],
      }),
      true,
    );

    // Create contratos table
    await queryRunner.createTable(
      new Table({
        name: 'contratos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'numero', type: 'varchar' },
          { name: 'descricao', type: 'text' },
          { name: 'dataInicio', type: 'timestamp' },
          { name: 'dataFim', type: 'timestamp', isNullable: true },
          { name: 'valorTotal', type: 'numeric', precision: 15, scale: 2 },
          { name: 'valorExecutado', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'valorPendente', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'fornecedor', type: 'varchar', isNullable: true },
          { name: 'cnpjFornecedor', type: 'varchar', isNullable: true },
          { name: 'nomeResponsavel', type: 'varchar', isNullable: true },
          { name: 'cpfResponsavel', type: 'varchar', isNullable: true },
          { name: 'ativo', type: 'boolean', default: true },
          { name: 'termos', type: 'jsonb', isNullable: true },
          { name: 'observacoes', type: 'text', isNullable: true },
          { name: 'criadoEm', type: 'timestamp', default: 'now()' },
          { name: 'atualizadoEm', type: 'timestamp', default: 'now()' },
          { name: 'prestacaoId', type: 'uuid' },
        ],
      }),
      true,
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'prestacoes',
      new TableForeignKey({
        columnNames: ['usuarioCriadorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'documentos_fiscais',
      new TableForeignKey({
        columnNames: ['prestacaoId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'prestacoes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'pagamentos',
      new TableForeignKey({
        columnNames: ['prestacaoId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'prestacoes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'responsaveis',
      new TableForeignKey({
        columnNames: ['prestacaoId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'prestacoes',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'contratos',
      new TableForeignKey({
        columnNames: ['prestacaoId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'prestacoes',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'prestacoes',
      new TableIndex({
        columnNames: ['competencia', 'usuarioCriadorId'],
      }),
    );

    await queryRunner.createIndex(
      'prestacoes',
      new TableIndex({
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'documentos_fiscais',
      new TableIndex({
        columnNames: ['prestacaoId', 'numero'],
      }),
    );

    await queryRunner.createIndex(
      'documentos_fiscais',
      new TableIndex({
        columnNames: ['data'],
      }),
    );

    await queryRunner.createIndex(
      'pagamentos',
      new TableIndex({
        columnNames: ['prestacaoId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'pagamentos',
      new TableIndex({
        columnNames: ['dataPagamento'],
      }),
    );

    await queryRunner.createIndex(
      'responsaveis',
      new TableIndex({
        columnNames: ['prestacaoId', 'tipo'],
      }),
    );

    await queryRunner.createIndex(
      'contratos',
      new TableIndex({
        columnNames: ['prestacaoId', 'numero'],
      }),
    );

    await queryRunner.createIndex(
      'contratos',
      new TableIndex({
        columnNames: ['dataInicio', 'dataFim'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.dropTable('contratos', true);
    await queryRunner.dropTable('responsaveis', true);
    await queryRunner.dropTable('pagamentos', true);
    await queryRunner.dropTable('documentos_fiscais', true);
    await queryRunner.dropTable('prestacoes', true);
    await queryRunner.dropTable('users', true);
  }
}
