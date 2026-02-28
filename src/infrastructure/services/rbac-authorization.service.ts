/**
 * ============================================
 * SERVICE: RBACAuthorizationService
 * ============================================
 * Feature 012: RBAC + Organizations
 *
 * Implements three-tier authorization model:
 * 1. SUPER_ADMIN: always has ALL permissions (short-circuit)
 * 2. ADMIN: has only explicitly granted permissions
 * 3. USER: has permissions only via organization membership
 *
 * CRITICAL: This is the core of the RBAC system.
 */

import { IAuthorizationService } from '../../application/ports/authorization.service.port.js';
import { UserRepository } from '../../domain/repositories/user.repository.interface.js';
import { IAdminPermissionRepository } from '../../domain/repositories/admin-permission.repository.interface.js';
import { IOrganizationMembershipRepository } from '../../domain/repositories/organization-membership.repository.interface.js';
import { UserId } from '../../domain/value-objects/user-id.value-object.js';
import { AdminPermission } from '../../domain/value-objects/admin-permission.value-object.js';
import { OrganizationRoleValue } from '../../domain/value-objects/organization-role.value-object.js';

/**
 * Role-based permission matrix for organization roles
 */
const ROLE_PERMISSIONS: Record<OrganizationRoleValue, string[]> = {
  org_admin: [
    'assign_members',
    'remove_members',
    'change_member_role',
    'view_members',
    'view_patients',
    'edit_patients',
    'create_appointment',
    'cancel_appointment',
    'view_appointments',
    'edit_appointments',
    'administer_medication',
    'view_medical_records',
    'edit_medical_records',
  ],
  doctor: [
    'view_patients',
    'edit_patients',
    'create_appointment',
    'cancel_appointment',
    'view_appointments',
    'edit_appointments',
    'view_medical_records',
    'edit_medical_records',
    'prescribe_medication',
  ],
  nurse: [
    'view_patients',
    'edit_patients',
    'view_appointments',
    'administer_medication',
    'view_medical_records',
  ],
  specialist: [
    'view_patients',
    'edit_patients',
    'view_appointments',
    'view_medical_records',
    'edit_medical_records',
  ],
  staff: ['view_patients', 'view_appointments'],
  guest: ['view_patients'],
};

/**
 * RBAC Authorization Service
 */
export class RBACAuthorizationService implements IAuthorizationService {
  constructor(
    private userRepository: UserRepository,
    private adminPermissionRepository: IAdminPermissionRepository,
    private membershipRepository: IOrganizationMembershipRepository
  ) {}

  /**
   * Checks if a user is a SUPER_ADMIN.
   */
  public async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(UserId.create(userId));
    if (!user) return false;
    return user.isSuperAdmin();
  }

  /**
   * Checks if a user is an ADMIN.
   */
  public async isAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(UserId.create(userId));
    if (!user) return false;
    return user.isAdmin();
  }

  /**
   * Checks if an ADMIN user has a specific permission.
   */
  public async hasAdminPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const adminPermission = AdminPermission.create(permission);
      return await this.adminPermissionRepository.hasPermission(
        userId,
        adminPermission
      );
    } catch {
      return false;
    }
  }

  /**
   * Checks if a user has a specific permission.
   * Implements three-tier authorization model.
   */
  public async hasPermission(
    userId: string,
    permission: string,
    organizationId?: string
  ): Promise<boolean> {
    // Tier 1: SUPER_ADMIN always has ALL permissions
    if (await this.isSuperAdmin(userId)) {
      return true;
    }

    // Tier 2: ADMIN has only explicitly granted permissions
    const user = await this.userRepository.findById(UserId.create(userId));
    if (user?.isAdmin()) {
      return await this.hasAdminPermission(userId, permission);
    }

    // Tier 3: USER has permissions via organization membership
    if (organizationId) {
      const membership = await this.membershipRepository.findActiveMembership(
        userId,
        organizationId
      );
      if (!membership) {
        return false;
      }

      // Check if role has the permission
      return this.roleHasPermission(membership.role.getValue(), permission);
    }

    return false;
  }

  /**
   * Checks if a user can access a specific organization.
   */
  public async canAccessOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    // SUPER_ADMIN can access all organizations
    if (await this.isSuperAdmin(userId)) {
      return true;
    }

    // ADMIN with VIEW_ALL_DATA can access all organizations
    const user = await this.userRepository.findById(UserId.create(userId));
    if (user?.isAdmin()) {
      const hasViewAllData = await this.hasAdminPermission(
        userId,
        'view_all_data'
      );
      if (hasViewAllData) {
        return true;
      }
    }

    // Check if user is an active member
    const membership = await this.membershipRepository.findActiveMembership(
      userId,
      organizationId
    );
    return membership !== null;
  }

  /**
   * Gets a user's role within a specific organization.
   */
  public async getUserOrganizationRole(
    userId: string,
    organizationId: string
  ): Promise<string | null> {
    const membership = await this.membershipRepository.findActiveMembership(
      userId,
      organizationId
    );
    return membership?.role.getValue() ?? null;
  }

  /**
   * Checks if a role has a specific permission.
   * @private
   */
  private roleHasPermission(
    role: OrganizationRoleValue,
    permission: string
  ): boolean {
    const permissions = ROLE_PERMISSIONS[role] ?? [];
    return permissions.includes(permission);
  }
}
