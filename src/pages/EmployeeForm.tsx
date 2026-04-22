import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Trash2, Upload, X } from 'lucide-react'
import { fetchEmployee, createEmployee, updateEmployee, deleteEmployee } from '../lib/api'

const employeeSchema = z.object({
  employeeCode: z.string().optional(),
  firstName: z.string().min(1, 'กรุณาระบุชื่อ'),
  lastName: z.string().min(1, 'กรุณาระบุนามสกุล'),
  citizenId: z.string().min(13, 'เลขบัตรประชาชนต้องมี 13 หลัก'),
  birthDate: z.string().min(1, 'กรุณาระบุวันเกิด'),
  phone: z.string().min(10, 'เบอร์โทรต้องมีอย่างน้อย 10 หลัก'),
  address: z.string().min(1, 'กรุณาระบุที่อยู่'),
  startDate: z.string().min(1, 'กรุณาระบุวันที่เริ่มงาน'),
  endDate: z.string().optional(),
  status: z.enum(['active', 'resigned']),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      status: 'active',
    },
  })

  const status = watch('status')

  useEffect(() => {
    if (id) {
      loadEmployee()
    }
  }, [id])

  async function loadEmployee() {
    if (!id) return
    try {
      const data = await fetchEmployee(id)
      if (data) {
        setValue('employeeCode', data.employeeCode || '')
        setValue('firstName', data.firstName)
        setValue('lastName', data.lastName)
        setValue('citizenId', data.citizenId)
        setValue('birthDate', data.birthDate)
        setValue('phone', data.phone)
        setValue('address', data.address)
        setValue('startDate', data.startDate)
        setValue('endDate', data.endDate || '')
        setValue('status', data.status)
        if (data.profileImageUrl) {
          setPreviewUrl(data.profileImageUrl)
        }
        // Note: We don't load existing attachments back into the File state
        // because File objects can't be recreated from stored data
        // Attachments will be preserved in the database unless new ones are uploaded
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    }
  }

  async function handleDelete() {
    if (!id) return

    try {
      setLoading(true)
      await deleteEmployee(id)
      navigate('/employees')
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('เกิดข้อผิดพลาดในการลบข้อมูล')
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  async function onSubmit(values: EmployeeFormValues) {
    setLoading(true)
    try {
      let profileImageUrl = previewUrl

      if (profileImage) {
        profileImageUrl = await compressImage(profileImage)
      }

      // Convert attachments to base64
      const attachmentData = await Promise.all(
        attachments.map(async (file) => {
          const base64 = await fileToBase64(file)
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
          }
        })
      )

      const employeeData = {
        employeeCode: values.employeeCode || null,
        firstName: values.firstName,
        lastName: values.lastName,
        citizenId: values.citizenId,
        birthDate: values.birthDate,
        phone: values.phone,
        address: values.address,
        profileImageUrl,
        startDate: values.startDate,
        endDate: values.endDate || null,
        status: values.status,
        attachments: attachmentData,
      }

      if (id) {
        await updateEmployee(id, employeeData)
      } else {
        await createEmployee(employeeData)
      }

      navigate('/employees')
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
            resolve(compressedDataUrl)
          } else {
            reject(new Error('Failed to get canvas context'))
          }
        }
        img.onerror = (error) => reject(error)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  function handleRemoveImage() {
    setProfileImage(null)
    setPreviewUrl(null)
  }

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)
      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB per file
      const MAX_TOTAL_FILES = 5 // Maximum 5 files total

      // Check file sizes
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE)
      if (oversizedFiles.length > 0) {
        alert(`ไฟล์ต้องไม่เกิน 5MB ต่อไฟล์`)
        return
      }

      // Check total file count
      const totalFiles = attachments.length + newFiles.length
      if (totalFiles > MAX_TOTAL_FILES) {
        alert(`สามารถอัปโหลดได้สูงสุด ${MAX_TOTAL_FILES} ไฟล์`)
        return
      }

      setAttachments(prev => [...prev, ...newFiles])
    }
  }

  function handleRemoveAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {id ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Profile Image Upload */}
        <div className="flex items-center space-x-6">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="รูปบัตรประจำตัว"
                className="w-32 h-32 rounded-xl object-cover ring-4 ring-blue-50"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-xs text-gray-500">อัปโหลดรูป</span>
            </div>
          )}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รูปบัตรประจำตัว
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ JPG, PNG (สูงสุด 5MB)</p>
          </div>
        </div>

        {/* File Attachments */}
        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            เอกสารแนบ
          </label>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleAttachmentChange}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                เพิ่มไฟล์
              </button>
            </div>
            <p className="text-xs text-gray-500">รองรับไฟล์ JPG, PNG, PDF (สูงสุด 5MB ต่อไฟล์, สูงสุด 5 ไฟล์)</p>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <span className="text-xs text-gray-500">
                        {file.type.startsWith('image/') ? 'รูปภาพ' : 'PDF'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัสพนักงาน
            </label>
            <input
              {...register('employeeCode')}
              type="text"
              placeholder="เช่น EMP001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">รหัสพนักงาน (ถ้ามี)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อ
            </label>
            <input
              {...register('firstName')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              นามสกุล
            </label>
            <input
              {...register('lastName')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลขบัตรประชาชน
            </label>
            <input
              {...register('citizenId')}
              type="text"
              maxLength={13}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.citizenId && (
              <p className="text-red-500 text-sm mt-1">{errors.citizenId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันเกิด
            </label>
            <input
              {...register('birthDate')}
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.birthDate && (
              <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทร
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ที่อยู่
            </label>
            <input
              {...register('address')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่เริ่มงาน
            </label>
            <input
              {...register('startDate')}
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">กำลังทำงาน</option>
              <option value="resigned">ลาออก</option>
            </select>
          </div>

          {status === 'resigned' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่ลาออก
              </label>
              <input
                {...register('endDate')}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
          {id && (
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
              <span>ลบข้อมูล</span>
            </button>
          )}
          <div className="flex space-x-4 ml-auto">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'กำลังบันทึก...' : 'บันทึก'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">ยืนยันการลบ</h3>
            <p className="text-gray-600 mb-6">
              คุณต้องการลบข้อมูลพนักงานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex space-x-4 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                <span>{loading ? 'กำลังลบ...' : 'ลบข้อมูล'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
