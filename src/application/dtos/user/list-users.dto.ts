/**
 * ============================================
 * DTO: List Users
 * ============================================
 *
 * DTOs para el caso de uso de listar usuarios.
 */

/**
 * DTO de entrada para listar usuarios.
 */
export interface ListUsersRequestDto {
  /** ID del usuario que ejecuta la acción */
  readonly executorId: string;
  /** Página (1-indexed) */
  readonly page?: number;
  /** Elementos por página */
  readonly limit?: number;
  /** Búsqueda por email o nombre */
  readonly search?: string | undefined;
}

/**
 * Datos de un usuario en la lista.
 */
export interface UserListItemDto {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly systemRole: string;
  readonly status: string;
  readonly emailVerified: boolean;
  readonly createdAt: string;
  /** Proveedor de autenticación principal del usuario */
  readonly authProvider: 'local' | 'google' | 'microsoft';
}

/**
 * DTO de respuesta para listar usuarios.
 */
export interface ListUsersResponseDto {
  readonly users: UserListItemDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}
