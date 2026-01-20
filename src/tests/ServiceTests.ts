/**
 * ServiceTests - Testes para serviços principais do AUDESP
 */

import { TestSuite } from './TestSuite';
import { AUDESPValidator } from '../services/AUDESPValidator';
import { RBACService } from '../services/RBACService';
import { JWTAuthService, JWTConfig } from '../services/JWTAuthService';
import { XMLReporter } from '../services/XMLReporter';

export class ServiceTests {
  static registerAll(): void {
    this.registerValidatorTests();
    this.registerRBACTests();
    this.registerJWTTests();
    this.registerXMLTests();
  }

  /**
   * Testes do Validador
   */
  private static registerValidatorTests(): void {
    const validator = AUDESPValidator.getInstance();

    TestSuite.getInstance().register({
      id: 'validator-001',
      name: 'Validar CNPJ válido',
      description: 'Verifica se um CNPJ válido passa na validação',
      test: () => {
        const result = validator.validateCNPJ('34.028.316/0001-86');
        TestSuite.assert(result.isValid, 'CNPJ deveria ser válido');
      },
      expectedResult: 'CNPJ válido',
      tags: ['validator', 'cnpj'],
    });

    TestSuite.getInstance().register({
      id: 'validator-002',
      name: 'Rejeitar CNPJ inválido',
      description: 'Verifica se um CNPJ inválido é rejeitado',
      test: () => {
        const result = validator.validateCNPJ('00.000.000/0000-00');
        TestSuite.assert(!result.isValid, 'CNPJ deveria ser inválido');
      },
      expectedResult: 'CNPJ rejeitado',
      tags: ['validator', 'cnpj'],
    });

    TestSuite.getInstance().register({
      id: 'validator-003',
      name: 'Validar CPF válido',
      description: 'Verifica se um CPF válido passa na validação',
      test: () => {
        const result = validator.validateCPF('111.444.777-35');
        TestSuite.assert(result.isValid, 'CPF deveria ser válido');
      },
      expectedResult: 'CPF válido',
      tags: ['validator', 'cpf'],
    });

    TestSuite.getInstance().register({
      id: 'validator-004',
      name: 'Validar data em formato correto',
      description: 'Verifica se data em formato DD/MM/YYYY é aceita',
      test: () => {
        const result = validator.validateDate('31/12/2023');
        TestSuite.assert(result.isValid, 'Data deveria ser válida');
      },
      expectedResult: 'Data válida',
      tags: ['validator', 'date'],
    });

    TestSuite.getInstance().register({
      id: 'validator-005',
      name: 'Rejeitar data inválida',
      description: 'Verifica se data inválida é rejeitada',
      test: () => {
        const result = validator.validateDate('32/13/2023');
        TestSuite.assert(!result.isValid, 'Data deveria ser inválida');
      },
      expectedResult: 'Data rejeitada',
      tags: ['validator', 'date'],
    });

    TestSuite.getInstance().register({
      id: 'validator-006',
      name: 'Validar valor monetário',
      description: 'Verifica se valor monetário é validado corretamente',
      test: () => {
        const result = validator.validateCurrency('1234567.89');
        TestSuite.assert(result.isValid, 'Valor deveria ser válido');
      },
      expectedResult: 'Valor válido',
      tags: ['validator', 'currency'],
    });
  }

  /**
   * Testes do RBAC
   */
  private static registerRBACTests(): void {
    const rbac = RBACService.getInstance();

    TestSuite.getInstance().register({
      id: 'rbac-001',
      name: 'Criar usuário',
      description: 'Verifica se um usuário pode ser criado',
      test: () => {
        rbac.reset();
        const user = rbac.createUser('user1', '34.028.316/0001-86', 'user@test.com', 'Test User', 'operator');
        TestSuite.assert(user.id === 'user1', 'Usuário deveria ser criado com ID correto');
      },
      expectedResult: 'Usuário criado',
      tags: ['rbac', 'user-management'],
    });

    TestSuite.getInstance().register({
      id: 'rbac-002',
      name: 'Autenticar usuário',
      description: 'Verifica se um usuário pode ser autenticado',
      test: () => {
        rbac.reset();
        rbac.createUser('user1', '34.028.316/0001-86', 'user@test.com', 'Test User', 'operator');
        const result = rbac.authenticate('user1');
        TestSuite.assert(result, 'Autenticação deveria ser bem-sucedida');
      },
      expectedResult: 'Usuário autenticado',
      tags: ['rbac', 'authentication'],
    });

    TestSuite.getInstance().register({
      id: 'rbac-003',
      name: 'Verificar permissão',
      description: 'Verifica se verificação de permissão funciona',
      test: () => {
        rbac.reset();
        rbac.createUser('user1', '34.028.316/0001-86', 'user@test.com', 'Test User', 'admin');
        rbac.authenticate('user1');
        const hasPermission = rbac.hasPermission('form.create');
        TestSuite.assert(hasPermission, 'Admin deveria ter permissão');
      },
      expectedResult: 'Permissão verificada',
      tags: ['rbac', 'permissions'],
    });

    TestSuite.getInstance().register({
      id: 'rbac-004',
      name: 'Atualizar role do usuário',
      description: 'Verifica se o role de um usuário pode ser atualizado',
      test: () => {
        rbac.reset();
        rbac.createUser('user1', '34.028.316/0001-86', 'user@test.com', 'Test User', 'operator');
        rbac.updateUserRole('user1', 'admin');
        const user = rbac.getUser('user1');
        TestSuite.assert(user?.role === 'admin', 'Role deveria ser atualizado para admin');
      },
      expectedResult: 'Role atualizado',
      tags: ['rbac', 'user-management'],
    });

    TestSuite.getInstance().register({
      id: 'rbac-005',
      name: 'Desativar usuário',
      description: 'Verifica se um usuário pode ser desativado',
      test: () => {
        rbac.reset();
        rbac.createUser('user1', '34.028.316/0001-86', 'user@test.com', 'Test User', 'operator');
        rbac.deactivateUser('user1');
        const user = rbac.getUser('user1');
        TestSuite.assert(!user?.isActive, 'Usuário deveria estar inativo');
      },
      expectedResult: 'Usuário desativado',
      tags: ['rbac', 'user-management'],
    });
  }

  /**
   * Testes do JWT
   */
  private static registerJWTTests(): void {
    const config: JWTConfig = { secret: 'test-secret', expiresIn: '1h' };
    const jwt = JWTAuthService.initialize(config);

    TestSuite.getInstance().register({
      id: 'jwt-001',
      name: 'Gerar token JWT',
      description: 'Verifica se um token JWT pode ser gerado',
      test: () => {
        const token = jwt.generateToken('34.028.316/0001-86');
        TestSuite.assert(token.token.length > 0, 'Token deveria ser gerado');
        TestSuite.assert(token.expiresAt > new Date(), 'Token deveria ter data de expiração futura');
      },
      expectedResult: 'Token gerado',
      tags: ['jwt', 'authentication'],
    });

    TestSuite.getInstance().register({
      id: 'jwt-002',
      name: 'Verificar token válido',
      description: 'Verifica se um token válido passa na verificação',
      test: () => {
        const token = jwt.generateToken('34.028.316/0001-86');
        const verification = jwt.verifyToken(token.token);
        TestSuite.assert(verification.valid, 'Token deveria ser válido');
      },
      expectedResult: 'Token verificado',
      tags: ['jwt', 'authentication'],
    });

    TestSuite.getInstance().register({
      id: 'jwt-003',
      name: 'Rejeitar token inválido',
      description: 'Verifica se um token inválido é rejeitado',
      test: () => {
        const verification = jwt.verifyToken('invalid.token.here');
        TestSuite.assert(!verification.valid, 'Token inválido deveria ser rejeitado');
      },
      expectedResult: 'Token rejeitado',
      tags: ['jwt', 'authentication'],
    });

    TestSuite.getInstance().register({
      id: 'jwt-004',
      name: 'Obter header de autorização',
      description: 'Verifica se header de autorização é gerado corretamente',
      test: () => {
        jwt.generateToken('34.028.316/0001-86');
        const header = jwt.getAuthorizationHeader('34.028.316/0001-86');
        TestSuite.assert(
          header?.startsWith('Bearer '),
          'Header deveria começar com Bearer'
        );
      },
      expectedResult: 'Header gerado',
      tags: ['jwt', 'authentication'],
    });
  }

  /**
   * Testes do XML Reporter
   */
  private static registerXMLTests(): void {
    const xmlReporter = XMLReporter.getInstance();

    TestSuite.getInstance().register({
      id: 'xml-001',
      name: 'Validar XML simples',
      description: 'Verifica se um XML simples passa na validação',
      test: () => {
        const xml = '<?xml version="1.0"?><audesp><header></header><identificacao><cnpj>34028316000186</cnpj></identificacao></audesp>';
        const validation = xmlReporter.validateXML(xml);
        TestSuite.assert(validation.isValid, 'XML deveria ser válido');
      },
      expectedResult: 'XML válido',
      tags: ['xml', 'reporting'],
    });

    TestSuite.getInstance().register({
      id: 'xml-002',
      name: 'Rejeitar XML sem cabeçalho',
      description: 'Verifica se XML sem declaração é rejeitado',
      test: () => {
        const xml = '<audesp><header></header></audesp>';
        const validation = xmlReporter.validateXML(xml);
        TestSuite.assert(!validation.isValid, 'XML sem declaração deveria ser inválido');
      },
      expectedResult: 'XML rejeitado',
      tags: ['xml', 'reporting'],
    });

    TestSuite.getInstance().register({
      id: 'xml-003',
      name: 'Converter XML para JSON',
      description: 'Verifica se XML pode ser convertido para JSON',
      test: () => {
        const xml = '<?xml version="1.0"?><audesp><test>value</test></audesp>';
        const json = xmlReporter.xmlToJSON(xml);
        TestSuite.assert(json.test === 'value', 'XML deveria ser convertido para JSON');
      },
      expectedResult: 'XML convertido',
      tags: ['xml', 'reporting'],
    });
  }
}

// Registrar todos os testes ao importar
ServiceTests.registerAll();
