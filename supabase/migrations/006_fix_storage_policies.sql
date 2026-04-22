-- Drop existing storage policies
DROP POLICY IF EXISTS "users_can_view_own_profile_image" ON storage.objects;
DROP POLICY IF EXISTS "admins_can_upload_profile_images" ON storage.objects;
DROP POLICY IF EXISTS "admins_can_delete_profile_images" ON storage.objects;
DROP POLICY IF EXISTS "admins_can_upload_employee_files" ON storage.objects;
DROP POLICY IF EXISTS "admins_can_select_employee_files" ON storage.objects;
DROP POLICY IF EXISTS "employees_can_view_own_files" ON storage.objects;
DROP POLICY IF EXISTS "admins_can_delete_employee_files" ON storage.objects;

-- Create permissive policies for storage (for demo)
CREATE POLICY "enable_all_on_profile_images" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'profile-images')
  WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "enable_all_on_employee_files" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'employee-files')
  WITH CHECK (bucket_id = 'employee-files');
