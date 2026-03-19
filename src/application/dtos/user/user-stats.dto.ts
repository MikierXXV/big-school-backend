/**
 * ============================================
 * DTO: User Stats
 * ============================================
 *
 * DTOs para el caso de uso GetUserStats.
 * Devuelve estadísticas agregadas de usuarios sin paginar.
 */

/**
 * DTO de entrada para obtener estadísticas de usuarios.
 */
export interface GetUserStatsRequestDto {
  /** ID del usuario que ejecuta la acción */
  readonly executorId: string;
}

/**
 * DTO de respuesta con estadísticas agregadas de usuarios.
 */
export interface GetUserStatsResponseDto {
  /** Total de usuarios en el sistema */
  readonly total: number;
  /** Número de usuarios con email verificado */
  readonly emailVerified: number;
  /** Conteo de usuarios por rol de sistema */
  readonly byRole: {
    readonly user: number;
    readonly admin: number;
    readonly super_admin: number;
  };
  /** Conteo de usuarios por estado */
  readonly byStatus: {
    readonly active: number;
    readonly suspended: number;
    readonly pending_verification: number;
    readonly deactivated: number;
  };
  /** Conteo de usuarios por proveedor de autenticación */
  readonly byProvider: {
    readonly local: number;
    readonly google: number;
    readonly microsoft: number;
  };
}
