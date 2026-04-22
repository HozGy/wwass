-- Make profile-images bucket public
UPDATE storage.buckets
SET public = true
WHERE name = 'profile-images';
