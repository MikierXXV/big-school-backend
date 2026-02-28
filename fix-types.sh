#!/bin/bash
# Fix all type issues in the new use cases

# Add UserId import to files that need it
for file in src/application/use-cases/admin/demote-to-user.use-case.ts \
            src/application/use-cases/admin/get-admin-permissions.use-case.ts \
            src/application/use-cases/admin/grant-admin-permission.use-case.ts \
            src/application/use-cases/admin/revoke-admin-permission.use-case.ts \
            src/application/use-cases/membership/assign-user-to-organization.use-case.ts \
            src/application/use-cases/membership/get-organization-members.use-case.ts
do
  if ! grep -q "import.*UserId" "$file"; then
    sed -i '1a import { UserId } from '"'"'../../../domain/value-objects/user-id.value-object.js'"'"';' "$file"
  fi
done

echo "Type fixes applied"
