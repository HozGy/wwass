-- Create storage buckets (these need to be created via Supabase dashboard or API)
-- The SQL below creates the policies assuming buckets exist

-- Bucket: profile-images
-- Policy: Authenticated users can read their own profile image
CREATE POLICY "users_can_view_own_profile_image"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
  );

-- Policy: Admins can upload profile images
CREATE POLICY "admins_can_upload_profile_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND is_admin()
  );

-- Policy: Admins can delete profile images
CREATE POLICY "admins_can_delete_profile_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND is_admin()
  );

-- Bucket: employee-files
-- Policy: Admins can upload employee files
CREATE POLICY "admins_can_upload_employee_files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee-files' AND is_admin()
  );

-- Policy: Admins can select all employee files
CREATE POLICY "admins_can_select_employee_files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-files' AND is_admin()
  );

-- Policy: Employees can view their own files
CREATE POLICY "employees_can_view_own_files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Admins can delete employee files
CREATE POLICY "admins_can_delete_employee_files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'employee-files' AND is_admin()
  );

-- Grant permissions on buckets
GRANT ALL ON SCHEMA storage TO authenticated;
GRANT ALL ON SCHEMA storage TO anon;
