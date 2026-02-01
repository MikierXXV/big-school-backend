/**
 * ============================================
 * REPOSITORY: InMemoryUserRepository
 * ============================================
 *
 * Implementación del UserRepository en memoria.
 * SOLO para tests - NO usar en producción.
 *
 * CARACTERÍSTICAS:
 * - Almacena usuarios en un Map
 * - Simula todas las operaciones
 * - Permite preset de datos
 * - Fácil de resetear
 */

import {
  UserRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../../domain/repositories/user.repository.interface.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { Email } from '../../../domain/value-objects/email.value-object.js';
import { UserAlreadyExistsError, UserNotFoundError } from '../../../domain/errors/user.errors.js';

/**
 * Implementación en memoria del UserRepository.
 * Solo para tests.
 */
export class InMemoryUserRepository implements UserRepository {
  /**
   * Almacén de usuarios (Map por ID).
   * @private
   */
  private users: Map<string, User> = new Map();

  /**
   * Índice por email para búsquedas rápidas.
   * @private
   */
  private emailIndex: Map<string, string> = new Map(); // email -> userId

  /**
   * Guarda un nuevo usuario.
   *
   * @param user - Usuario a guardar
   * @throws UserAlreadyExistsError si el email ya existe
   */
  public async save(user: User): Promise<void> {
    // Verificar unicidad de email
    if (this.emailIndex.has(user.email.value)) {
      throw new UserAlreadyExistsError(user.email.value);
    }

    // Guardar usuario
    this.users.set(user.id.value, user);
    this.emailIndex.set(user.email.value, user.id.value);
  }

  /**
   * Actualiza un usuario existente.
   *
   * @param user - Usuario con cambios
   * @throws UserNotFoundError si no existe
   */
  public async update(user: User): Promise<void> {
    if (!this.users.has(user.id.value)) {
      throw new UserNotFoundError(user.id.value);
    }

    // Obtener usuario anterior para actualizar índice de email si cambió
    const existingUser = this.users.get(user.id.value)!;
    if (existingUser.email.value !== user.email.value) {
      this.emailIndex.delete(existingUser.email.value);
      this.emailIndex.set(user.email.value, user.id.value);
    }

    this.users.set(user.id.value, user);
  }

  /**
   * Elimina un usuario.
   *
   * @param userId - ID del usuario
   * @throws UserNotFoundError si no existe
   */
  public async delete(userId: UserId): Promise<void> {
    const user = this.users.get(userId.value);
    if (!user) {
      throw new UserNotFoundError(userId.value);
    }

    this.emailIndex.delete(user.email.value);
    this.users.delete(userId.value);
  }

  /**
   * Busca un usuario por ID.
   *
   * @param id - ID del usuario
   * @returns User o null
   */
  public async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.value) ?? null;
  }

  /**
   * Busca un usuario por email.
   *
   * @param email - Email del usuario
   * @returns User o null
   */
  public async findByEmail(email: Email): Promise<User | null> {
    const userId = this.emailIndex.get(email.value);
    if (!userId) {
      return null;
    }
    return this.users.get(userId) ?? null;
  }

  /**
   * Verifica si un email ya existe.
   *
   * @param email - Email a verificar
   * @returns true si existe
   */
  public async existsByEmail(email: Email): Promise<boolean> {
    return this.emailIndex.has(email.value);
  }

  /**
   * Obtiene usuarios paginados.
   *
   * @param options - Opciones de paginación
   * @returns Resultado paginado
   */
  public async findAll(
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    const allUsers = Array.from(this.users.values());
    const total = allUsers.length;
    const totalPages = Math.ceil(total / options.limit);
    const offset = (options.page - 1) * options.limit;

    // Ordenar si se especifica
    let sorted = allUsers;
    if (options.sortBy) {
      sorted = [...allUsers].sort((a, b) => {
        // Simplificado: solo soporta ordenar por createdAt
        const aVal = a.createdAt.getTime();
        const bVal = b.createdAt.getTime();
        return options.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    const items = sorted.slice(offset, offset + options.limit);

    return {
      items,
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrevious: options.page > 1,
    };
  }

  // ============================================
  // TEST HELPERS (solo para tests)
  // ============================================

  /**
   * Resetea el repositorio (limpia todos los datos).
   * Solo para tests.
   */
  public reset(): void {
    this.users.clear();
    this.emailIndex.clear();
  }

  /**
   * Obtiene la cantidad de usuarios almacenados.
   * Solo para tests.
   */
  public count(): number {
    return this.users.size;
  }

  /**
   * Preset de usuarios para tests.
   * Solo para tests.
   *
   * @param users - Array de usuarios a precargar
   */
  public seed(users: User[]): void {
    for (const user of users) {
      this.users.set(user.id.value, user);
      this.emailIndex.set(user.email.value, user.id.value);
    }
  }
}
