-- ==============================================================================
-- Supabase Storage Configuration & Policies for Chi Hội Manager
-- Bucket: 'documents' (Private organization-scoped documents)
-- ==============================================================================

-- 1. Create Private Storage Bucket for Chi Hội Documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB max file size
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Storage RLS Policies for 'documents' bucket
-- Storage objects path convention: organizations/{organizationId}/...

-- Policy 2.1: Users can download/view files if they belong to the organization
CREATE POLICY "Org members can read documents in storage"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    -- Path format: organizations/<org_id>/...
    (storage.foldername(name))[1] = 'organizations'
    AND public.is_org_member(((storage.foldername(name))[2])::uuid)
  )
);

-- Policy 2.2: Org members can upload files into their organization folder
CREATE POLICY "Org members can upload documents to storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = 'organizations'
    AND public.is_org_member(((storage.foldername(name))[2])::uuid)
  )
);

-- Policy 2.3: Board or file owner can update storage objects
CREATE POLICY "Board and owners can update documents in storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = 'organizations'
    AND (
      public.is_org_board(((storage.foldername(name))[2])::uuid)
      OR owner = auth.uid()
    )
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = 'organizations'
    AND (
      public.is_org_board(((storage.foldername(name))[2])::uuid)
      OR owner = auth.uid()
    )
  )
);

-- Policy 2.4: Board or file owner can delete storage objects
CREATE POLICY "Board and owners can delete documents from storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = 'organizations'
    AND (
      public.is_org_board(((storage.foldername(name))[2])::uuid)
      OR owner = auth.uid()
    )
  )
);
