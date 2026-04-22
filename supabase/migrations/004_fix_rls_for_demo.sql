-- Drop existing RLS policies for demo purposes
DROP POLICY IF EXISTS "admins_can_select_all_employees" ON employees;
DROP POLICY IF EXISTS "admins_can_insert_employees" ON employees;
DROP POLICY IF EXISTS "admins_can_update_all_employees" ON employees;
DROP POLICY IF EXISTS "admins_can_delete_employees" ON employees;
DROP POLICY IF EXISTS "employees_can_view_own_basic_info" ON employees;

DROP POLICY IF EXISTS "admins_can_select_all_files" ON employee_files;
DROP POLICY IF EXISTS "admins_can_insert_files" ON employee_files;
DROP POLICY IF EXISTS "admins_can_delete_files" ON employee_files;
DROP POLICY IF EXISTS "employees_can_view_own_files" ON employee_files;

DROP POLICY IF EXISTS "admins_can_select_all_attendance" ON attendance;
DROP POLICY IF EXISTS "admins_can_insert_attendance" ON attendance;
DROP POLICY IF EXISTS "admins_can_update_attendance" ON attendance;
DROP POLICY IF EXISTS "employees_can_view_own_attendance" ON attendance;

-- Create permissive policies for demo/development
-- Allow all authenticated users (using anon key) to perform all operations

CREATE POLICY "enable_all_for_employees" ON employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "enable_all_for_employee_files" ON employee_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "enable_all_for_attendance" ON attendance
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
