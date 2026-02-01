/**
 * ============================================
 * REPOSITORY INTERFACE: UserRepository
 * ============================================
 *
 * Define el contrato para la persistencia de usuarios.
 * Esta INTERFAZ pertenece al dominio; las IMPLEMENTACIONES
 * están en infraestructura.
 *
 * RESPONSABILIDADES:
 * - Definir operaciones CRUD sobre User
 * - Definir queries específicas del dominio
 * - Abstraer completamente el mecanismo de persistencia
 *
 * PRINCIPIO:
 * El dominio dice QUÉ necesita; infraestructura dice CÓMO lo hace.
 *
 * IMPLEMENTACIONES POSIBLES (en infraestructura):
 * - PostgresUserRepository
 * - MongoUserRepository
 * - InMemoryUserRepository (para tests)
 */

import { User } from '../entities/user.entity.js';
import { UserId } from '../value-objects/user-id.value-object.js';
import { Email } from '../value-objects/email.value-object.js';

/**
 * Interfaz del repositorio de usuarios.
 * Port de salida para persistencia de User.
 */
export interface UserRepository {
  // ============================================
  // COMANDOS (modifican estado)
  // ============================================

  /**
   * Guarda un nuevo usuario.
   * Si el usuario ya existe, lanza error.
   *
   * @param user - Usuario a guardar
   * @returns Promise<void>
   * @throws UserAlreadyExistsError si el email ya está registrado
   *
   * TODO: Implementar en infraestructura
   */
  save(user: User): Promise<void>;

  /**
   * Actualiza un usuario existente.
   * Si no existe, lanza error.
   *
   * @param user - Usuario con cambios
   * @returns Promise<void>
   * @throws UserNotFoundError si no existe
   *
   * TODO: Implementar en infraestructura
   */
  update(user: User): Promise<void>;

  /**
   * Elimina un usuario (soft delete recomendado).
   *
   * @param userId - ID del usuario a eliminar
   * @returns Promise<void>
   * @throws UserNotFoundError si no existe
   *
   * TODO: Implementar en infraestructura
   */
  delete(userId: UserId): Promise<void>;

  // ============================================
  // QUERIES (solo lectura)
  // ============================================

  /**
   * Busca un usuario por su ID.
   *
   * @param id - ID del usuario
   * @returns Promise<User | null> - null si no existe
   *
   * TODO: Implementar en infraestructura
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Busca un usuario por su email.
   * Útil para login y verificación de unicidad.
   *
   * @param email - Email del usuario
   * @returns Promise<User | null> - null si no existe
   *
   * TODO: Implementar en infraestructura
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Verifica si un email ya está registrado.
   * Más eficiente que findByEmail cuando solo necesitas saber si existe.
   *
   * @param email - Email a verificar
   * @returns Promise<boolean> - true si ya existe
   *
   * TODO: Implementar en infraestructura
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Obtiene todos los usuarios (paginado).
   * Útil para administración.
   *
   * @param options - Opciones de paginación
   * @returns Promise con usuarios y metadata de paginación
   *
   * TODO: Implementar en infraestructura
   */
  findAll(options: PaginationOptions): Promise<PaginatedResult<User>>;
}

/**
 * Opciones de paginación para queries
 */
export interface PaginationOptions {
  /** Página actual (1-indexed) */
  readonly page: number;
  /** Elementos por página */
  readonly limit: number;
  /** Campo por el cual ordenar */
  readonly sortBy?: string;
  /** Dirección del orden */
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado genérico
 */
export interface PaginatedResult<T> {
  /** Items de la página actual */
  readonly items: T[];
  /** Total de items */
  readonly total: number;
  /** Página actual */
  readonly page: number;
  /** Elementos por página */
  readonly limit: number;
  /** Total de páginas */
  readonly totalPages: number;
  /** ¿Hay página siguiente? */
  readonly hasNext: boolean;
  /** ¿Hay página anterior? */
  readonly hasPrevious: boolean;
}
