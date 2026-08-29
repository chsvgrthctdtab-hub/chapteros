-- ==============================================================================
-- Supabase Storage Configuration & Policies for Organization Logos
-- Bucket: 'organization-logos' (Public read, admin-only write)
-- ==============================================================================

-- 1. Create Storage Bucket for Organization Logos if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  5242880, -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ];

-- 2. Storage RLS Policies for 'organization-logos' bucket
-- Storage objects path convention: {organization_id}/logo.{ext}

-- Policy 2.1: Anyone can read/view organization logos (Public)
DROP POLICY IF EXISTS "Public read for organization logos" ON storage.objects;
CREATE POLICY "Public read for organization logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-logos');

-- Policy 2.2: Org admins and board members can upload logo for their organization
DROP POLICY IF EXISTS "Org admins can upload organization logo" ON storage.objects;
CREATE POLICY "Org admins can upload organization logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos'
  AND (
    public.is_org_admin((split_part(name, '/', 1))::uuid)
    OR public.is_org_board((split_part(name, '/', 1))::uuid)
  )
);

-- Policy 2.3: Org admins and board members can update/overwrite logo for their organization
DROP POLICY IF EXISTS "Org admins can update organization logo" ON storage.objects;
CREATE POLICY "Org admins can update organization logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos'
  AND (
    public.is_org_admin((split_part(name, '/', 1))::uuid)
    OR public.is_org_board((split_part(name, '/', 1))::uuid)
  )
)
WITH CHECK (
  bucket_id = 'organization-logos'
  AND (
    public.is_org_admin((split_part(name, '/', 1))::uuid)
    OR public.is_org_board((split_part(name, '/', 1))::uuid)
  )
);

-- Policy 2.4: Org admins and board members can delete logo for their organization
DROP POLICY IF EXISTS "Org admins can delete organization logo" ON storage.objects;
CREATE POLICY "Org admins can delete organization logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos'
  AND (
    public.is_org_admin((split_part(name, '/', 1))::uuid)
    OR public.is_org_board((split_part(name, '/', 1))::uuid)
  )
);
