import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Edit, Eye, Filter, User, Phone, Calendar, ChevronLeft, ChevronRight, Download, Upload, X } from 'lucide-react'
import { fetchEmployees, exportEmployeesToCSV, importEmployeesFromCSV } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { Employee } from '../types'

export default function EmployeeList() {
  const { isAuthenticated } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resigned'>('all')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const ITEMS_PER_PAGE = 9

  useEffect(() => {
    fetchEmployeesData()
  }, [currentPage])

  async function fetchEmployeesData() {
    try {
      setLoading(true)
      const response = await fetchEmployees(currentPage, ITEMS_PER_PAGE)
      if (response && response.data && response.pagination) {
        setEmployees(response.data)
        setTotalPages(response.pagination.totalPages)
      } else {
        console.error('Invalid API response structure:', response)
        setEmployees([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setEmployees([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    filterEmployees()
  }, [employees, searchQuery, statusFilter])

  function handlePageChange(page: number) {
    setCurrentPage(page)
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  async function handleImport() {
    if (!importFile) return

    setImporting(true)
    try {
      const csvData = await importFile.text()
      const result = await importEmployeesFromCSV(csvData)
      alert(`นำเข้าข้อมูลสำเร็จ ${result.importedCount} รายการ`)
      setShowImportModal(false)
      setImportFile(null)
      fetchEmployeesData()
    } catch (error) {
      console.error('Error importing employees:', error)
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล')
    } finally {
      setImporting(false)
    }
  }

  function filterEmployees() {
    let filtered = employees

    if (statusFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (emp) =>
          emp.firstName.toLowerCase().includes(query) ||
          emp.lastName.toLowerCase().includes(query) ||
          emp.phone.includes(query) ||
          emp.citizenId.includes(query) ||
          (emp.employeeCode && emp.employeeCode.toLowerCase().includes(query))
      )
    }

    setFilteredEmployees(filtered)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            รายชื่อพนักงาน
          </h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลพนักงานทั้งหมด</p>
        </div>
        <div className="flex space-x-3">
          {isAuthenticated && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Upload className="h-5 w-5" />
              <span className="font-medium">Import CSV</span>
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={exportEmployeesToCSV}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Download className="h-5 w-5" />
              <span className="font-medium">Export CSV</span>
            </button>
          )}
          {isAuthenticated && (
            <Link
              to="/employees/new"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">เพิ่มพนักงาน</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจากชื่อ, เบอร์โทร, รหัสพนักงาน, หรือเลขบัตรประชาชน"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-200">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'resigned')}
              className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">กำลังทำงาน</option>
              <option value="resigned">ลาออก</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
          <p className="text-gray-500 mt-4">กำลังโหลดข้อมูล...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
          <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">ไม่พบข้อมูลพนักงาน</p>
          <p className="text-gray-400 text-sm mt-2">ลองปรับตัวกรองหรือคำค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div
              key={employee._id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {employee.profileImageUrl ? (
                      <img
                        src={employee.profileImageUrl}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        className="h-16 w-16 rounded-xl object-cover ring-4 ring-blue-50"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ring-4 ring-blue-50">
                        <span className="text-2xl font-bold text-white">
                          {(employee.firstName || '?')[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      {employee.employeeCode && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg mb-1">
                          {employee.employeeCode}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">•••••••••••••</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      employee.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {employee.status === 'active' ? 'กำลังทำงาน' : 'ลาออก'}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{employee.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      เริ่มงาน {new Date(employee.startDate).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <Link
                    to={`/employees/${employee._id}`}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors group-hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">ดูโปรไฟล์</span>
                  </Link>
                  {isAuthenticated && (
                    <Link
                      to={`/employees/${employee._id}/edit`}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="text-sm font-medium">แก้ไข</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">นำเข้าข้อมูลพนักงาน</h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกไฟล์ CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFileChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {importFile && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-700">
                    ไฟล์ที่เลือก: <span className="font-semibold">{importFile.name}</span>
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  รูปแบบไฟล์ CSV: รหัสพนักงาน, ชื่อ, นามสกุล, เลขบัตรประชาชน, วันเกิด, เบอร์โทร, ที่อยู่, วันที่เริ่มงาน, วันที่ลาออก, สถานะ
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'กำลังนำเข้า...' : 'นำเข้า'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
