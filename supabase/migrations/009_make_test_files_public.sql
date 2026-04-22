-- Make employee-files bucket public
UPDATE storage.buckets
SET public = true
WHERE name = 'employee-files';
