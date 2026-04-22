import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchEmployees, fetchEmployee, createEmployee, updateEmployee, deleteEmployee } from './api'

// Mock global fetch
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchEmployees', () => {
    it('should fetch employees with pagination', async () => {
      const mockData = {
        data: [
          {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            employeeCode: 'EMP001',
            citizenId: '1234567890123',
            birthDate: '1990-01-01',
            phone: '0812345678',
            address: 'Test Address',
            profileImageUrl: null,
            startDate: '2020-01-01',
            endDate: null,
            status: 'active',
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2020-01-01T00:00:00Z',
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response)

      const result = await fetchEmployees(1, 10)

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/employees?page=1&limit=10')
      expect(result).toEqual(mockData)
    })
  })

  describe('fetchEmployee', () => {
    it('should fetch a single employee by id', async () => {
      const mockData = {
        _id: '1',
        firstName: 'John',
        lastName: 'Doe',
        employeeCode: 'EMP001',
        citizenId: '1234567890123',
        birthDate: '1990-01-01',
        phone: '0812345678',
        address: 'Test Address',
        profileImageUrl: null,
        startDate: '2020-01-01',
        endDate: null,
        status: 'active',
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2020-01-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response)

      const result = await fetchEmployee('1')

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/employees/1')
      expect(result).toEqual(mockData)
    })
  })

  describe('createEmployee', () => {
    it('should create a new employee', async () => {
      const mockEmployeeData = {
        firstName: 'John',
        lastName: 'Doe',
        citizenId: '1234567890123',
        birthDate: '1990-01-01',
        phone: '0812345678',
        address: 'Test Address',
        startDate: '2020-01-01',
        status: 'active',
      }

      const mockResponse = {
        _id: '1',
        ...mockEmployeeData,
        employeeCode: 'EMP001',
        profileImageUrl: null,
        endDate: null,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2020-01-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await createEmployee(mockEmployeeData)

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEmployeeData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateEmployee', () => {
    it('should update an existing employee', async () => {
      const mockEmployeeData = {
        firstName: 'John Updated',
        lastName: 'Doe',
        citizenId: '1234567890123',
        birthDate: '1990-01-01',
        phone: '0812345678',
        address: 'Test Address',
        startDate: '2020-01-01',
        status: 'active',
      }

      const mockResponse = {
        _id: '1',
        ...mockEmployeeData,
        employeeCode: 'EMP001',
        profileImageUrl: null,
        endDate: null,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2020-01-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await updateEmployee('1', mockEmployeeData)

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/employees/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEmployeeData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteEmployee', () => {
    it('should delete an employee', async () => {
      const mockResponse = { message: 'Employee deleted successfully' }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await deleteEmployee('1')

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/employees/1', {
        method: 'DELETE',
      })
      expect(result).toEqual(mockResponse)
    })
  })
})
