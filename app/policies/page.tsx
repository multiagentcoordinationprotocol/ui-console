'use client';

import { PolicyManagement } from '@/components/settings/policy-management';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

/**
 * /policies — Runtime policy catalog.
 *
 * Moved here from /settings per Q4/Q28/Q29 decisions in
 * plans/ui-improvement-plan.md. Policies are platform catalog data,
 * not user preferences. A dedicated top-level route makes deep-linking
 * from run detail (policy version badges → /policies/[policyId])
 * shareable and discoverable.
 */
export default function PoliciesPage() {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>Policies</h1>
          <p>
            RFC-MACP-0012 runtime policies currently registered with the control plane. Register, inspect, and
            unregister policies; click a row to see the full descriptor and recent runs that used it.
          </p>
        </div>
      </div>
      <PolicyManagement demoMode={demoMode} />
    </div>
  );
}
