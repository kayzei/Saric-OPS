# Supabase Implementation Guide - Performance Edition

## 1. High-Performance RLS Policies

To ensure your database scales efficiently, avoid calling `auth.uid()` directly in your `USING` clauses. Instead, wrap it in a scalar subquery. This allows Postgres to treat the result as a constant for the duration of the query execution.

### Optimized Schema Update

```sql
-- 1. Optimized User Organizations Policy
DROP POLICY IF EXISTS "Users see own orgs" ON public.user_organizations;
CREATE POLICY "Users see own orgs" 
ON public.user_organizations 
FOR SELECT 
TO authenticated 
USING (user_id = (SELECT auth.uid()));

-- 2. Optimized Asset Tracking Policy
-- Using subselect to fetch organization context once
DROP POLICY IF EXISTS "Org-based asset access" ON public.assets;
CREATE POLICY "Org-based asset access"
ON public.assets
FOR ALL
TO authenticated
USING (
  organization_id = (
    SELECT organization_id FROM public.profiles 
    WHERE id = (SELECT auth.uid())
    LIMIT 1
  )
);
```

## 2. Recommended Indexes

Run these commands to ensure that the RLS filters use Index Scans instead of Sequential Scans.

```sql
-- Index for tenant isolation
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON public.assets (organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices (organization_id);

-- Composite index for dashboard filtering
CREATE INDEX IF NOT EXISTS idx_assets_status_tenant ON public.assets (organization_id, status);
```

## 3. Real-time Telemetry Setup

To enable low-latency map updates, you must enable the `realtime` publication for the `assets` table:

```sql
-- Enable Realtime for the assets table
alter publication supabase_realtime add table public.assets;
```

## 4. Troubleshooting Performance

If you experience latency:
1. Run `EXPLAIN ANALYZE SELECT * FROM assets;` as an authenticated user.
2. Confirm that the `Filter` includes a `SubPlan` rather than calling the auth function for every row.
3. Ensure the `Index Scan` is hitting `idx_assets_tenant`.