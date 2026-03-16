/**
 * ============================================
 * REPOSITORY: PostgresOrganizationRepository
 * ============================================
 *
 * Implementación de IOrganizationRepository para PostgreSQL.
 *
 * TABLA: organizations
 * - id: UUID PRIMARY KEY
 * - name: VARCHAR(200) NOT NULL UNIQUE
 * - type: organization_type NOT NULL
 * - description: TEXT NULL
 * - address: VARCHAR(500) NULL
 * - contact_email: VARCHAR(254) NULL
 * - contact_phone: VARCHAR(50) NULL
 * - active: BOOLEAN NOT NULL DEFAULT true
 * - created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * - updated_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
 */

import { Pool } from 'pg';
import { IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface.js';
import { Organization } from '../../../domain/entities/organization.entity.js';
import { OrganizationType } from '../../../domain/value-objects/organization-type.value-object.js';

interface OrganizationRow {
  id: string;
  name: string;
  type: string;
  description: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PostgresOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly pool: Pool) {}

  public async save(organization: Organization): Promise<void> {
    const query = `
      INSERT INTO organizations (id, name, type, description, address, contact_email, contact_phone, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await this.pool.query(query, [
      organization.id,
      organization.name,
      organization.type.getValue(),
      organization.description,
      organization.address,
      organization.contactEmail,
      organization.contactPhone,
      organization.active,
      organization.createdAt,
      organization.updatedAt,
    ]);
  }

  public async findById(id: string): Promise<Organization | null> {
    const result = await this.pool.query<OrganizationRow>(
      `SELECT id, name, type, description, address, contact_email, contact_phone, active, created_at, updated_at
       FROM organizations WHERE id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return null;
    return this.rowToEntity(row);
  }

  public async findByName(name: string): Promise<Organization | null> {
    const result = await this.pool.query<OrganizationRow>(
      `SELECT id, name, type, description, address, contact_email, contact_phone, active, created_at, updated_at
       FROM organizations WHERE name = $1`,
      [name]
    );
    const row = result.rows[0];
    if (!row) return null;
    return this.rowToEntity(row);
  }

  public async findAll(options?: {
    active?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<Organization[]> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    // Active filter: undefined = all, true = active only, false = inactive only
    if (options?.active !== undefined) {
      params.push(options.active);
      conditions.push(`active = $${params.length}`);
    }

    if (options?.search && options.search.trim()) {
      params.push(`%${options.search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(`(lower(name) LIKE $${idx} OR lower(contact_email) LIKE $${idx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let query = `
      SELECT id, name, type, description, address, contact_email, contact_phone, active, created_at, updated_at
      FROM organizations
      ${whereClause}
      ORDER BY name ASC
    `;

    if (options?.limit !== undefined) {
      params.push(options.limit);
      query += ` LIMIT $${params.length}`;
    }
    if (options?.offset !== undefined) {
      params.push(options.offset);
      query += ` OFFSET $${params.length}`;
    }

    const result = await this.pool.query<OrganizationRow>(query, params);
    return result.rows.map((row) => this.rowToEntity(row));
  }

  public async update(organization: Organization): Promise<void> {
    await this.pool.query(
      `UPDATE organizations SET
        name = $2, type = $3, description = $4, address = $5,
        contact_email = $6, contact_phone = $7, active = $8, updated_at = $9
       WHERE id = $1`,
      [
        organization.id,
        organization.name,
        organization.type.getValue(),
        organization.description,
        organization.address,
        organization.contactEmail,
        organization.contactPhone,
        organization.active,
        organization.updatedAt,
      ]
    );
  }

  public async delete(id: string): Promise<void> {
    await this.pool.query(
      'UPDATE organizations SET active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
  }

  public async hardDelete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM organizations WHERE id = $1', [id]);
  }

  private rowToEntity(row: OrganizationRow): Organization {
    return Organization.fromPersistence({
      id: row.id,
      name: row.name,
      type: OrganizationType.create(row.type),
      description: row.description,
      address: row.address,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      active: row.active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
