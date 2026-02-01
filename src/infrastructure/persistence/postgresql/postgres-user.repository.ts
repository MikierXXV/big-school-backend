/**
 * ============================================
 * REPOSITORY: PostgresUserRepository
 * ============================================
 *
 * Implementación del UserRepository para PostgreSQL.
 * Adaptador que implementa el puerto definido en el dominio.
 *
 * RESPONSABILIDADES:
 * - Traducir entre entidades de dominio y filas de BD
 * - Ejecutar queries SQL
 * - Manejar conexiones/transacciones
 *
 * TABLA: users
 * - id: UUID PRIMARY KEY
 * - email: VARCHAR(254) UNIQUE NOT NULL
 * - password_hash: VARCHAR(100) NOT NULL
 * - first_name: VARCHAR(100) NOT NULL
 * - last_name: VARCHAR(100) NOT NULL
 * - status: VARCHAR(50) NOT NULL
 * - created_at: TIMESTAMP NOT NULL
 * - updated_at: TIMESTAMP NOT NULL
 * - last_login_at: TIMESTAMP NULL
 * - email_verified_at: TIMESTAMP NULL
 *
 * DEPENDENCIAS (a instalar):
 * - pg (node-postgres) o similar
 */

import {
  UserRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../../domain/repositories/user.repository.interface.js';
import { User, UserStatus, UserProps } from '../../../domain/entities/user.entity.js';
import { UserId } from '../../../domain/value-objects/user-id.value-object.js';
import { Email } from '../../../domain/value-objects/email.value-object.js';
import { PasswordHash } from '../../../domain/value-objects/password-hash.value-object.js';

/**
 * Fila de la tabla users (representación de BD).
 */
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
  email_verified_at: Date | null;
}

/**
 * Implementación de UserRepository para PostgreSQL.
 */
export class PostgresUserRepository implements UserRepository {
  /**
   * Cliente de base de datos.
   * Puede ser pg.Pool, Kysely, Drizzle, etc.
   * @private
   */
  // private readonly db: DatabaseClient;

  /**
   * Constructor con inyección del cliente de BD.
   *
   * @param db - Cliente de base de datos
   */
  // constructor(db: DatabaseClient) {
  //   this.db = db;
  // }

  /**
   * Guarda un nuevo usuario.
   *
   * @param user - Usuario a guardar
   *
   * TODO: Implementar INSERT
   */
  public async save(user: User): Promise<void> {
    // TODO: Implementar
    // const query = `
    //   INSERT INTO users (
    //     id, email, password_hash, first_name, last_name,
    //     status, created_at, updated_at, last_login_at, email_verified_at
    //   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    // `;
    //
    // await this.db.query(query, [
    //   user.id.value,
    //   user.email.value,
    //   user.passwordHash.value,
    //   user.firstName,
    //   user.lastName,
    //   user.status,
    //   user.createdAt,
    //   user.updatedAt,
    //   user.lastLoginAt,
    //   user.emailVerifiedAt,
    // ]);

    // Placeholder
    throw new Error('PostgresUserRepository.save not implemented');
  }

  /**
   * Actualiza un usuario existente.
   *
   * @param user - Usuario con cambios
   *
   * TODO: Implementar UPDATE
   */
  public async update(user: User): Promise<void> {
    // TODO: Implementar

    // Placeholder
    throw new Error('PostgresUserRepository.update not implemented');
  }

  /**
   * Elimina un usuario.
   *
   * @param userId - ID del usuario
   *
   * TODO: Implementar DELETE (o soft delete)
   */
  public async delete(userId: UserId): Promise<void> {
    // TODO: Implementar

    // Placeholder
    throw new Error('PostgresUserRepository.delete not implemented');
  }

  /**
   * Busca un usuario por ID.
   *
   * @param id - ID del usuario
   * @returns User o null
   *
   * TODO: Implementar SELECT
   */
  public async findById(id: UserId): Promise<User | null> {
    // TODO: Implementar

    // Placeholder
    throw new Error('PostgresUserRepository.findById not implemented');
  }

  /**
   * Busca un usuario por email.
   *
   * @param email - Email del usuario
   * @returns User o null
   *
   * TODO: Implementar SELECT
   */
  public async findByEmail(email: Email): Promise<User | null> {
    // TODO: Implementar

    // Placeholder
    throw new Error('PostgresUserRepository.findByEmail not implemented');
  }

  /**
   * Verifica si un email ya existe.
   *
   * @param email - Email a verificar
   * @returns true si existe
   *
   * TODO: Implementar SELECT COUNT
   */
  public async existsByEmail(email: Email): Promise<boolean> {
    // TODO: Implementar

    // Placeholder
    throw new Error('PostgresUserRepository.existsByEmail not implemented');
  }

  /**
   * Obtiene usuarios paginados.
   *
   * @param options - Opciones de paginación
   * @returns Resultado paginado
   *
   * TODO: Implementar SELECT con LIMIT/OFFSET
   */
  public async findAll(
    options: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    // TODO: Implementar

    // Placeholder
    throw new Error('PostgresUserRepository.findAll not implemented');
  }

  /**
   * Convierte una fila de BD a entidad User.
   *
   * @param row - Fila de la tabla users
   * @returns Entidad User
   *
   * @private
   */
  private rowToEntity(row: UserRow): User {
    const props: UserProps = {
      id: UserId.create(row.id),
      email: Email.create(row.email),
      passwordHash: PasswordHash.fromHash(row.password_hash),
      firstName: row.first_name,
      lastName: row.last_name,
      status: row.status as UserStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
      emailVerifiedAt: row.email_verified_at,
    };

    return User.fromPersistence(props);
  }
}
