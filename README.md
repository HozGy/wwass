# ระบบจัดการข้อมูลพนักงาน (Employee Management System)

ระบบจัดการข้อมูลพนักงานที่สร้างด้วย React + Supabase (Database + Storage)

## ฟีเจอร์หลัก

- ✅ เพิ่ม/แก้ไขข้อมูลพนักงาน (ชื่อ-สกุล, เลขบัตรประชาชน, วันเกิด, เบอร์โทร, ที่อยู่, รูปถ่าย)
- ✅ แนบไฟล์บัตรประชาชน (PDF หรือรูปภาพ) ได้หลายไฟล์ต่อพนักงาน
- ✅ ค้นหาข้อมูลพนักงาน (จากชื่อ, เบอร์โทร, เลขบัตรประชาชน)
- ✅ ระบบแจ้งเตือนอายุครบเกษียณ (อายุ 60 ปีบริบูรณ์) - แสดงรายชื่อพนักงานที่กำลังจะเกษียณใน 6 เดือนข้างหน้า
- ✅ รายงานการเข้า-ออกของพนักงาน (check-in / check-out) พร้อมดึงข้อมูลมาแสดงในรูปแบบตาราง
- ✅ เรียกดูรูปภาพจากไฟล์ที่แนบ (รูปถ่ายพนักงาน + ไฟล์บัตรประชาชน)
- ✅ ค้นหาและแสดงตามประเภทพนักงาน: กำลังทำงาน (active) หรือ ลาออก (inactive)
- ✅ แยกข้อมูลการจัดเก็บวันที่เริ่มงาน และวันที่ลาออก (start_date, end_date)
- ✅ ใช้ Supabase เป็น Backend (PostgreSQL DB + Storage)
- ✅ ออกแบบ Database Schema และตั้งค่า Row Level Security (RLS) ให้ปลอดภัย

## เทคโนโลยีที่ใช้

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: TailwindCSS
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **File Upload**: react-dropzone
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Backend**: Supabase (PostgreSQL + Storage)
- **Authentication**: Supabase Auth

## การติดตั้ง

### 1. Clone repository

```bash
git clone <repository-url>
cd employee-management
```

### 2. ติดตั้ง dependencies

```bash
npm install
```

### 3. ตั้งค่า Supabase

#### 3.1 สร้าง Supabase Project

1. ไปที่ [https://supabase.com](https://supabase.com)
2. สร้าง project ใหม่
3. รับ Supabase URL และ Anon Key จาก Settings > API

#### 3.2 รัน SQL Migration

ใน Supabase Dashboard > SQL Editor:

1. รันไฟล์ `supabase/migrations/001_initial_schema.sql`
2. รันไฟล์ `supabase/migrations/002_rls_policies.sql`
3. รันไฟล์ `supabase/migrations/003_storage_policies.sql`

#### 3.3 สร้าง Storage Buckets

ใน Supabase Dashboard > Storage:

1. สร้าง bucket ชื่อ `profile-images` (public)
2. สร้าง bucket ชื่อ `employee-files` (public)

#### 3.4 ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENCRYPTION_KEY=your_encryption_key_for_citizen_id
```

### 4. รัน Development Server

```bash
npm run dev
```

เปิด browser ที่ `http://localhost:5173`

## โครงสร้าง Database

### ตาราง employees

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| first_name | TEXT | ชื่อ |
| last_name | TEXT | นามสกุล |
| citizen_id | TEXT | เลขบัตรประชาชน (เข้ารหัส) |
| birth_date | DATE | วันเกิด |
| phone | TEXT | เบอร์โทร |
| address | TEXT | ที่อยู่ |
| profile_image_url | TEXT | URL รูปโปรไฟล์ |
| start_date | DATE | วันที่เริ่มงาน |
| end_date | DATE | วันที่ลาออก (nullable) |
| status | ENUM | 'active' หรือ 'resigned' |
| created_at | TIMESTAMPTZ | วันที่สร้าง |
| updated_at | TIMESTAMPTZ | วันที่แก้ไข |

### ตาราง employee_files

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | Foreign Key to employees |
| file_url | TEXT | URL ไฟล์ |
| file_type | TEXT | ประเภทไฟล์ (เช่น 'id_card') |
| original_filename | TEXT | ชื่อไฟล์เดิม |
| uploaded_at | TIMESTAMPTZ | วันที่อัปโหลด |

### ตาราง attendance

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | Foreign Key to employees |
| check_in_time | TIMESTAMPTZ | เวลาเข้างาน |
| check_out_time | TIMESTAMPTZ | เวลาออกงาน (nullable) |
| date | DATE | วันที่ |

## Row Level Security (RLS)

ระบบมีการตั้งค่า RLS เพื่อปกป้องข้อมูลส่วนบุคคล:

- **Admin**: ดู/แก้ไขข้อมูลทั้งหมดได้
- **พนักงานทั่วไป**: ดูได้เฉพาะข้อมูลของตัวเอง (ชื่อ, รูป, วันเกิด, สถานะการทำงาน)
- **ข้อมูลส่วนบุคคล** (เลขบัตรประชาชน, เบอร์โทร, ที่อยู่): เข้ารหัสและเฉพาะ admin เท่านั้นที่ดูได้

## การใช้งาน

### เพิ่มพนักงานใหม่

1. คลิกปุ่ม "เพิ่มพนักงาน"
2. กรอกข้อมูลพนักงาน
3. อัปโหลดรูปถ่าย (ถ้ามี)
4. อัปโหลดไฟล์บัตรประชาชน (PDF หรือรูปภาพ)
5. คลิก "บันทึก"

### แก้ไขข้อมูลพนักงาน

1. คลิกปุ่มแก้ไข (icon ดินสอ) ในตารางรายชื่อพนักงาน
2. แก้ไขข้อมูลที่ต้องการ
3. คลิก "บันทึก"

### ค้นหาพนักงาน

- พิมพ์ชื่อ, เบอร์โทร หรือเลขบัตรประชาชนในช่องค้นหา
- เลือกสถานะ (กำลังทำงาน/ลาออก) เพื่อ filter

### ดูรายละเอียดพนักงาน

1. คลิกปุ่มดู (icon ตา) ในตารางรายชื่อพนักงาน
2. ดูข้อมูลพนักงานและไฟล์แนบ

### แจ้งเตือนเกษียณ

1. ไปที่เมนู "แจ้งเตือนเกษียณ"
2. ดูรายชื่อพนักงานที่จะครบอายุ 60 ปีใน 6 เดือนข้างหน้า
3. ระบบแสดงสีแยกตามระยะเวลา (แดง = 1 เดือน, ส้ม = 3 เดือน, เหลือง = 6 เดือน)

### รายงานการเข้า-ออก

1. ไปที่เมนู "รายงานการเข้า-ออก"
2. เลือกพนักงาน (หรือ "ทั้งหมด")
3. เลือกช่วงวันที่
4. ดูสรุปและตารางรายการ

## Scripts

```bash
# รัน development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## ความปลอดภัย

- เลขบัตรประชาชนถูกเข้ารหัสก่อนบันทึกในฐานข้อมูล
- ใช้ Row Level Security (RLS) ของ Supabase เพื่อควบคุมการเข้าถึงข้อมูล
- ไฟล์ที่อัปโหลดมีการตั้งค่า policy ให้ปลอดภัย
- ใช้ Supabase Auth สำหรับการยืนยันตัวตน

## License

MIT
