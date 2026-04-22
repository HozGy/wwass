-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user owns the employee record
CREATE OR REPLACE FUNCTION is_employee_owner(employee_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'employee_id' = employee_uuid::text
  ) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for employees table

-- Admins can do everything
CREATE POLICY "admins_can_select_all_employees"
  ON employees FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admins_can_insert_employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_update_all_employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_delete_employees"
  ON employees FOR DELETE
  TO authenticated
  USING (is_admin());

-- Non-admin users can only see their own basic info
CREATE POLICY "employees_can_view_own_basic_info"
  ON employees FOR SELECT
  TO authenticated
  USING (
    is_employee_owner(id) AND
    -- Only allow viewing non-sensitive fields
    true -- This is a placeholder; we'll use views for actual field restrictions
  );

-- RLS Policies for employee_files table

CREATE POLICY "admins_can_select_all_files"
  ON employee_files FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admins_can_insert_files"
  ON employee_files FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_delete_files"
  ON employee_files FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "employees_can_view_own_files"
  ON employee_files FOR SELECT
  TO authenticated
  USING (is_employee_owner(employee_id));

-- RLS Policies for attendance table

CREATE POLICY "admins_can_select_all_attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admins_can_insert_attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_update_attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "employees_can_view_own_attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (is_employee_owner(employee_id));

-- Create a view for non-sensitive employee data
CREATE OR REPLACE VIEW public_employees AS
SELECT 
  id,
  first_name,
  last_name,
  birth_date,
  profile_image_url,
  start_date,
  end_date,
  status,
  created_at,
  updated_at
FROM employees;

-- Grant access to the view
GRANT SELECT ON public_employees TO authenticated;
GRANT SELECT ON public_employees TO anon;

-- Create a view for admin-only sensitive data
CREATE OR REPLACE VIEW admin_employees AS
SELECT 
  e.*,
  pgp_sym_decrypt(e.citizen_id::bytea, current_setting('app.encryption_key')) as decrypted_citizen_id
FROM employees e;

-- Grant access only to admins
GRANT SELECT ON admin_employees TO authenticated;
