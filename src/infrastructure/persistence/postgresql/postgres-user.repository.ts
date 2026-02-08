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
 * - Manejar conexiones via pool
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
 */

import { Pool } from 'pg';
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
   * Pool de conexiones a PostgreSQL.
   */
  private readonly pool: Pool;

  /**
   * Constructor con inyección del pool de conexiones.
   *
   * @param pool - Pool de conexiones PostgreSQL
   */
  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Guarda un nuevo usuario.
   *
   * @param user - Usuario a guardar
   */
  public async save(user: User): Promise<void> {
    const query = `
      INSERT INTO users (
        id, email, password_hash, first_name, last_name,
        status, created_at, updated_at, last_login_at, email_verified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await this.pool.query(query, [
      user.id.value,
      user.email.value,
      user.passwordHash.value,
      user.firstName,
      user.lastName,
      user.status,
      user.createdAt,
      user.updatedAt,
      user.lastLoginAt,
      user.emailVerifiedAt,
    ]);
  }

  /**
   * Actualiza un usuario existente.
   *
   * @param user - Usuario con cambios
   */
  public async update(user: User): Promise<void> {
    const query = `
      UPDATE users SET
        email = $2,
        password_hash = $3,
        first_name = $4,
        last_name = $5,
        status = $6,
        updated_at = $7,
        last_login_at = $8,
        email_verified_at = $9
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [
      user.id.value,
      user.email.value,
      user.passwordHash.value,
      user.firstName,
      user.lastName,
      user.status,
      user.updatedAt,
      user.lastLoginAt,
      user.emailVerifiedAt,
    ]);

    if (result.rowCount === 0) {
      throw new Error(`User with id ${user.id.value} not found`);
    }
  }

  /**
   * Elimina un usuario.
   *
   * @param userId - ID del usuario
   */
  public async delete(userId: UserId): Promise<void> {
    const query = 'DELETE FROM users WHERE id = $1';

    const result = await this.pool.query(query, [userId.value]);

    if (result.rowCount === 0) {
      throw new Error(`User with id ${userId.value} not found`);
    }
  }

  /**
   * Busca un usuario por ID.
   *
   * @param id - ID del usuario
   * @returns User o null
   */
  public async findById(id: UserId): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name,
             status, created_at, updated_at, last_login_at, email_verified_at
      FROM users
      WHERE id = $1
    `;

    const result = await this.pool.query<UserRow>(query, [id.value]);

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.rowToEntity(row);
  }

  /**
   * Busca un usuario por email.
   *
   * @param email - Email del usuario
   * @returns User o null
   */
  public async findByEmail(email: Email): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name,
             status, created_at, updated_at, last_login_at, email_verified_at
      FROM users
      WHERE email = $1
    `;

    const result = await this.pool.query<UserRow>(query, [email.value]);

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.rowToEntity(row);
  }

  /**
   * Verifica si un email ya existe.
   *
   * @param email - Email a verificar
   * @returns true si existe
   */
  public async existsByEmail(email: Email): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1 LIMIT 1';

    const result = await this.pool.query(query, [email.value]);

    return result.rows.length > 0;
  }

  /**
   * Obtiene usuarios paginados.
   *
   * @param options - Opciones de paginación
   * @returns Resultado paginado
   */
  public async findAll(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    // Validar sortBy para prevenir SQL injection
    const allowedSortColumns = ['created_at', 'updated_at', 'email', 'first_name', 'last_name', 'status'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Query para datos
    const dataQuery = `
      SELECT id, email, password_hash, first_name, last_name,
             status, created_at, updated_at, last_login_at, email_verified_at
      FROM users
      ORDER BY ${sortColumn} ${order}
      LIMIT $1 OFFSET $2
    `;

    // Query para total
    const countQuery = 'SELECT COUNT(*) as total FROM users';

    // Ejecutar ambas queries en paralelo
    const [dataResult, countResult] = await Promise.all([
      this.pool.query<UserRow>(dataQuery, [limit, offset]),
      this.pool.query<{ total: string }>(countQuery),
    ]);

    const countRow = countResult.rows[0];
    const total = countRow ? parseInt(countRow.total, 10) : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      items: dataResult.rows.map((row) => this.rowToEntity(row)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Convierte una fila de BD a entidad User.
   *
   * @param row - Fila de la tabla users
   * @returns Entidad User
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
