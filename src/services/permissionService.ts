/**
 * PERMISSION VALIDATION SERVICE
 * Valida permissões do usuário antes de operações críticas
 */

export interface UserPermissions {
  canTransmitConvenio: boolean;
  canTransmitContratoGestao: boolean;
  canTransmitParceria: boolean;
  canTransmitTermoFomento: boolean;
  canTransmitTermoColaboracao: boolean;
  canTransmitDeclaracaoNegativa: boolean;
}

export class PermissionService {
  /**
   * Valida se o usuário tem permissão para transmitir um tipo de documento
   * @param tipoDocumento Tipo de documento a validar
   * @param token Token de autenticação
   * @param cpf CPF do usuário
   */
  static async validateTransmissionPermission(
    tipoDocumento: string,
    token: string,
    cpf?: string
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    try {
      console.log(`[Permission] Validando permissão para: ${tipoDocumento}`);
      
      // NOTA: Idealmente, esse endpoint deveria existir no Audesp API
      // Por enquanto, fazemos uma validação básica
      
      // Validações básicas que podem prevenir alguns erros 403
      if (!token) {
        return {
          hasPermission: false,
          reason: 'Token não encontrado. Faça login novamente.'
        };
      }
      
      if (!cpf) {
        console.warn('[Permission] CPF não informado - prosseguindo com cautela');
      }

      // Validar token não expirado
      const tokenExpiry = sessionStorage.getItem('audesp_expire');
      if (tokenExpiry && parseInt(tokenExpiry) < Date.now()) {
        return {
          hasPermission: false,
          reason: 'Token expirado. Faça login novamente.'
        };
      }

      // Se chegou aqui, aparentemente tem permissão (validação real será feita pelo servidor)
      console.log(`[Permission] ✓ Validações básicas passadas para: ${tipoDocumento}`);
      
      return {
        hasPermission: true
      };

    } catch (error: any) {
      console.error('[Permission] Erro na validação:', error);
      return {
        hasPermission: false,
        reason: 'Erro ao validar permissões. Tente novamente.'
      };
    }
  }

  /**
   * Retorna mensagem de erro específica para 403 baseada no tipo de documento
   */
  static getPermissionErrorMessage(tipoDocumento: string, cpf?: string): string {
    const errorCode = `ERR-403-${Date.now().toString().slice(-6)}`;
    
    return `❌ Acesso Negado - Permissão Insuficiente

Seu CPF ${cpf ? `(${cpf})` : ''} não possui permissão para:
📄 ${tipoDocumento}

Possíveis motivos:
1. Seu perfil no Audesp não está configurado para este tipo de documento
2. Sua credencial está em processo de validação
3. Suas permissões foram revogadas temporariamente
4. Você está usando uma CPF/Email não autorizado

O que fazer:
✓ Tente com outra CPF que você sabe ter permissão
✓ Faça logout e login novamente
✓ Contate o administrador da sua instituição
✓ Se persisidr, contate suporte: suporte@audesp.tce.sp.gov.br

Código de erro: ${errorCode}`;
  }

  /**
   * Retorna sugestões de resolução para erro 403
   */
  static getResolutionSteps(tipoDocumento: string): string[] {
    return [
      '1. Verifique se seu CPF está ativo no Audesp',
      '2. Confirme que seu CPF tem permissão para transmitir este tipo de documento',
      '3. Faça logout (menu) e login novamente com suas credenciais',
      `4. Tente transmitir outro tipo de documento para confirmar se é específico de "${tipoDocumento}"`,
      '5. Se outros tipos também falham, sua credencial pode estar suspensa',
      '6. Entre em contato com o administrador da sua instituição',
      '7. Últimamente: suporte@audesp.tce.sp.gov.br com seu CPF e tipo de documento'
    ];
  }
}
