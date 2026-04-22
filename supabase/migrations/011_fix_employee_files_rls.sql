-- Drop existing policies on storage.objects for employee-files bucket
DROP POLICY IF EXISTS "Authenticated can upload employee-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view employee-files" ON storage.objects;

-- Create new permissive policies for employee-files bucket
CREATE POLICY "Authenticated can upload employee-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-files');

CREATE POLICY "Authenticated can view employee-files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-files');

CREATE POLICY "Authenticated can update employee-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-files')
WITH CHECK (bucket_id = 'employee-files');

CREATE POLICY "Authenticated can delete employee-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-files');
