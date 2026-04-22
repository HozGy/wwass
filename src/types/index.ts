export interface Employee {
  _id: string
  employeeCode: string | null
  firstName: string
  lastName: string
  citizenId: string
  birthDate: string
  phone: string
  address: string
  profileImageUrl: string | null
  startDate: string
  endDate: string | null
  status: 'active' | 'resigned'
  attachments?: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  name: string
  type: string
  size: number
  data: string
}

export interface EmployeeFile {
  _id: string
  employeeId: string
  fileUrl: string
  fileType: string
  originalFilename: string
  uploadedAt: string
}

export interface Attendance {
  _id: string
  employeeId: string
  checkInTime: string
  checkOutTime: string | null
  date: string
}

export interface EmployeeFormData {
  employeeCode?: string
  firstName: string
  lastName: string
  citizenId: string
  birthDate: string
  phone: string
  address: string
  profileImage?: File
  startDate: string
  endDate?: string
  status: 'active' | 'resigned'
}

export interface SearchFilters {
  query: string
  status?: 'active' | 'resigned' | 'all'
}
