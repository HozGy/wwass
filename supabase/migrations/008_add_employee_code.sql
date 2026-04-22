-- Add employee_code column to employees table
ALTER TABLE employees ADD COLUMN employee_code TEXT UNIQUE;

-- Create index on employee_code for faster lookups
CREATE INDEX idx_employees_employee_code ON employees(employee_code);
