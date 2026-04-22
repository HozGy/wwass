const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchEmployees(page = 1, limit = 10) {
  const response = await fetch(`${API_BASE}/employees?page=${page}&limit=${limit}`);
  return response.json();
}

export async function fetchEmployee(id: string) {
  const response = await fetch(`${API_BASE}/employees/${id}`);
  return response.json();
}

export async function createEmployee(employeeData: any) {
  const response = await fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  return response.json();
}

export async function updateEmployee(id: string, employeeData: any) {
  const response = await fetch(`${API_BASE}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  return response.json();
}

export async function deleteEmployee(id: string) {
  const response = await fetch(`${API_BASE}/employees/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function fetchStats() {
  const response = await fetch(`${API_BASE}/stats`);
  return response.json();
}

export async function fetchAttendance(employeeId?: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (employeeId && employeeId !== 'all') params.append('employeeId', employeeId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`${API_BASE}/attendance?${params}`);
  return response.json();
}

export async function fetchRetiringEmployees() {
  const response = await fetch(`${API_BASE}/retiring-employees`);
  return response.json();
}

export async function exportEmployeesToCSV() {
  const response = await fetch(`${API_BASE}/employees/export/csv`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employees.csv';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function importEmployeesFromCSV(csvData: string) {
  const response = await fetch(`${API_BASE}/employees/import/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvData }),
  });
  return response.json();
}
