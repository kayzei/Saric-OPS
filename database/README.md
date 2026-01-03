# Saric Ops Database - Testing Environment

This directory contains the database schema and seed data optimized for free-tier PostgreSQL hosting (Neon, Supabase, Render).

## Structure

*   `schema.sql`: Contains the table definitions, indexes, and triggers.
*   `seed.sql`: Contains mock data mirroring the frontend `constants.ts`.

## Deployment Instructions

1.  **Provision Database:**
    Create a new PostgreSQL project on a free-tier provider (e.g., Supabase.com).

2.  **Run Schema:**
    Copy the content of `schema.sql` and run it in the SQL Editor of your provider.

3.  **Run Seed Data:**
    Copy the content of `seed.sql` and run it to populate the database with initial testing data.

## Optimization Notes

*   **Multi-tenancy:** All primary tables (`assets`, `drivers`, `shipments`, `projects`) are scoped by `organization_id`.
*   **Security:** `audit_logs` table provided for critical action tracking.
*   **Performance:** Uses lightweight `TEXT` checks instead of PostgreSQL `ENUM` types for portability and ease of migration.
*   **Testing:** `users.is_mock` flag allows filtering of test accounts during analytics.
