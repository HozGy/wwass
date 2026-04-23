import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://hoz:0856213847@cluster0.xkkakz6.mongodb.net/employee-management?retryWrites=true&w=majority';
const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('employee-management');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

connectDB();

// API Routes

// Get all employees with pagination and search
app.get('/api/employees', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    // Build query filter
    let query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search filter (case-insensitive regex)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phone: searchRegex },
        { citizenId: searchRegex },
        { employeeCode: searchRegex }
      ];
    }

    const [data, total] = await Promise.all([
      db.collection('employees')
        .find(query)
        .sort({ createdAt: -1, _id: 1 })  // Add _id as tiebreaker for consistent pagination
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('employees').countDocuments(query)
    ]);
    
    const transformedData = data.map(emp => ({
      _id: emp._id.toString(),
      employeeCode: emp.employeeCode || null,
      firstName: emp.firstName,
      lastName: emp.lastName,
      citizenId: emp.citizenId,
      birthDate: emp.birthDate,
      phone: emp.phone,
      address: emp.address,
      profileImageUrl: emp.profileImageUrl || null,
      startDate: emp.startDate,
      endDate: emp.endDate || null,
      status: emp.status,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
    }));
    
    res.json({
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export employees to CSV
app.get('/api/employees/export/csv', async (req, res) => {
  try {
    const data = await db.collection('employees')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    const headers = ['รหัสพนักงาน', 'ชื่อ', 'นามสกุล', 'เลขบัตรประชาชน', 'วันเกิด', 'เบอร์โทร', 'ที่อยู่', 'วันที่เริ่มงาน', 'วันที่ลาออก', 'สถานะ'];
    const csvRows = [headers.join(',')];
    
    data.forEach(emp => {
      const row = [
        emp.employeeCode || '',
        emp.firstName,
        emp.lastName,
        emp.citizenId,
        emp.birthDate,
        emp.phone,
        emp.address,
        emp.startDate,
        emp.endDate || '',
        emp.status === 'active' ? 'กำลังทำงาน' : 'ลาออก'
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      csvRows.push(row);
    });
    
    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
    res.send('\uFEFF' + csvContent); // Add BOM for Excel UTF-8 support
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Parse Thai date format (e.g., "29 ม.ค. 73" or "18 ธ.ค. 52" or "18 12 52") to ISO date
function parseThaiDate(dateStr) {
  console.log('Parsing date:', JSON.stringify(dateStr));
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Handle "ปี 2520" format
  if (dateStr.includes('ปี')) {
    const yearMatch = dateStr.match(/ปี\s*(\d{4})/);
    if (yearMatch) {
      let year = parseInt(yearMatch[1]);
      if (year > 2400) year -= 543;
      // Return January 1st of that year as fallback
      return `${year}-01-01`;
    }
    return null;
  }
  
  const thaiMonths = {
    'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
    'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11
  };
  
  // Try pattern with Thai month names: "29 ม.ค. 73" or "29 มกราคม 2573"
  let match = dateStr.match(/(\d{1,2})\s*([\u0E01-\u0E4E\.]+)\s*(\d{2,4})/);
  
  let day, month, year;
  
  if (match) {
    // Thai month name format
    day = parseInt(match[1]);
    const monthThai = match[2];
    year = parseInt(match[3]);
    month = thaiMonths[monthThai];
    if (month === undefined) return null;
  } else {
    // Try numeric month format: "18 12 52" (day month year)
    match = dateStr.match(/(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})/);
    if (!match) {
      console.log('No match for date:', dateStr);
      return null;
    }
    day = parseInt(match[1]);
    month = parseInt(match[2]) - 1; // Convert to 0-indexed
    year = parseInt(match[3]);
  }
  
  console.log('Parsed:', { day, month, year });
  
  // Convert Buddhist year to Gregorian
  if (year > 2400) {
    year -= 543;
  } else if (year < 100) {
    // For 2-digit Thai Buddhist years: assume 25xx (e.g., "73" means 2573)
    // 2573 - 543 = 2030 (Gregorian)
    year += 2500 - 543; // Equivalent to adding 1957
  }
  
  const date = new Date(year, month, day);
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

// Import employees from CSV
app.post('/api/employees/import/csv', async (req, res) => {
  try {
    const { csvData } = req.body;
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or has no data' });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const employees = [];
    const now = new Date().toISOString();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length !== headers.length) continue;

      const employee = {
        employeeCode: values[0] || null,
        firstName: values[1] || '',
        lastName: values[2] || '',
        citizenId: values[3] || '',
        birthDate: parseThaiDate(values[4]) || '',
        phone: values[5] || '',
        address: values[6] || '',
        startDate: parseThaiDate(values[7]) || now,
        endDate: parseThaiDate(values[8]) || null,
        status: (values[9] === 'ลาออก' || values[9] === 'resigned') ? 'resigned' : 'active',
        profileImageUrl: null,
        createdAt: now,
        updatedAt: now,
      };

      if (employee.firstName && employee.lastName) {
        employees.push(employee);
      }
    }

    if (employees.length === 0) {
      return res.status(400).json({ error: 'No valid employee data found in CSV' });
    }

    console.log('Inserting', employees.length, 'employees');
    const result = await db.collection('employees').insertMany(employees);
    console.log('Insert result:', result);
    
    const employeeIds = result.insertedIds ? Object.values(result.insertedIds).map(id => id?.toString ? id.toString() : id) : [];
    
    res.json({
      message: 'Employees imported successfully',
      insertedCount: result.insertedCount || employees.length,
      employees: employeeIds
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Get single employee
app.get('/api/employees/:id', async (req, res) => {
  try {
    const data = await db.collection('employees')
      .findOne({ _id: new ObjectId(req.params.id) });
    
    if (!data) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const transformedData = {
      _id: data._id.toString(),
      employeeCode: data.employeeCode || null,
      firstName: data.firstName,
      lastName: data.lastName,
      citizenId: data.citizenId,
      birthDate: data.birthDate,
      phone: data.phone,
      address: data.address,
      profileImageUrl: data.profileImageUrl || null,
      startDate: data.startDate,
      endDate: data.endDate || null,
      status: data.status,
      resignationReason: data.resignationReason || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    
    res.json(transformedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
app.post('/api/employees', async (req, res) => {
  try {
    const employeeData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = await db.collection('employees').insertOne(employeeData);
    const newEmployee = {
      ...employeeData,
      _id: result.insertedId.toString(),
    };
    
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const existingEmployee = await db.collection('employees')
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeData = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('employees')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: employeeData }
      );

    const updatedEmployee = await db.collection('employees')
      .findOne({ _id: new ObjectId(req.params.id) });

    const transformedData = {
      ...updatedEmployee,
      _id: updatedEmployee._id.toString(),
    };

    res.json(transformedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    await db.collection('employees')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const total = await db.collection('employees').countDocuments({});
    const active = await db.collection('employees').countDocuments({ status: 'active' });
    const resigned = await db.collection('employees').countDocuments({ status: 'resigned' });
    
    // Use same logic as /api/retiring-employees for consistency
    const now = new Date();
    const currentYear = now.getFullYear();
    const fiscalYear = now.getMonth() >= 9 ? currentYear + 1 : currentYear;
    const fiscalYearStart = new Date(fiscalYear - 1, 9, 1);
    const fiscalYearEnd = new Date(fiscalYear, 8, 30);
    
    const employees = await db.collection('employees')
      .find({ status: 'active' })
      .toArray();
    
    const retiringSoonCount = employees.filter((emp) => {
      // Validate birthDate
      if (!emp.birthDate || emp.birthDate === '') return false;
      
      const birthDate = new Date(emp.birthDate);
      if (isNaN(birthDate.getTime())) return false;
      
      const sixtiethBirthday = new Date(birthDate);
      sixtiethBirthday.setFullYear(sixtiethBirthday.getFullYear() + 60);
      
      // Check if turning 60 in fiscal year
      return sixtiethBirthday >= fiscalYearStart && sixtiethBirthday <= fiscalYearEnd;
    }).length;
    
    res.json({ total, active, resigned, retiringSoon: retiringSoonCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (employeeId && employeeId !== 'all') {
      query.employeeId = employeeId;
    }
    
    const data = await db.collection('attendance')
      .find(query)
      .sort({ date: -1, checkInTime: -1 })
      .toArray();
    
    // Manual join with employees
    const employeeIds = [...new Set(data.map((a) => a.employeeId))];
    const employeeMap = new Map();
    if (employeeIds.length > 0) {
      const employeesData = await db.collection('employees')
        .find({ _id: { $in: employeeIds.map((id) => new ObjectId(id)) } })
        .toArray();
      
      employeesData.forEach((emp) => {
        employeeMap.set(emp._id.toString(), {
          _id: emp._id.toString(),
          firstName: emp.firstName,
          lastName: emp.lastName,
          profileImageUrl: emp.profileImageUrl || null,
        });
      });
    }
    
    const attendanceWithEmployee = data.map((record) => ({
      _id: record._id.toString(),
      employeeId: record.employeeId,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime || null,
      date: record.date,
      employee: employeeMap.get(record.employeeId) || null,
    }));
    
    res.json(attendanceWithEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get retiring employees
app.get('/api/retiring-employees', async (req, res) => {
  try {
    const data = await db.collection('employees')
      .find({ status: 'active' })
      .sort({ birthDate: 1 })
      .toArray();
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const fiscalYear = now.getMonth() >= 9 ? currentYear + 1 : currentYear;
    const fiscalYearStart = new Date(fiscalYear - 1, 9, 1);
    const fiscalYearEnd = new Date(fiscalYear, 8, 30);
    
    const employeesWithAge = data
      .map((emp) => {
        const employee = {
          _id: emp._id.toString(),
          employeeCode: emp.employeeCode || null,
          firstName: emp.firstName,
          lastName: emp.lastName,
          citizenId: emp.citizenId,
          birthDate: emp.birthDate,
          phone: emp.phone,
          address: emp.address,
          profileImageUrl: emp.profileImageUrl || null,
          startDate: emp.startDate,
          endDate: emp.endDate || null,
          status: emp.status,
          createdAt: emp.createdAt,
          updatedAt: emp.updatedAt,
        };
        
        // Validate birthDate
        if (!employee.birthDate || employee.birthDate === '') {
          return null; // Skip employees without birthDate
        }
        
        const birthDate = new Date(employee.birthDate);
        if (isNaN(birthDate.getTime())) {
          console.log('Invalid birthDate for employee:', employee.firstName, employee.lastName, employee.birthDate);
          return null; // Skip employees with invalid birthDate
        }
        
        const sixtiethBirthday = new Date(birthDate);
        sixtiethBirthday.setFullYear(sixtiethBirthday.getFullYear() + 60);
        
        const isTurning60InFiscalYear = sixtiethBirthday >= fiscalYearStart && sixtiethBirthday <= fiscalYearEnd;
        const contractEndDate = new Date(fiscalYearEnd);
        const monthsUntilContractEnd = Math.floor(
          (contractEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        
        return {
          ...employee,
          retirementDate: contractEndDate,
          sixtiethBirthday,
          monthsUntilRetirement: monthsUntilContractEnd,
          isRetiringInFiscalYear: isTurning60InFiscalYear,
        };
      })
      .filter((emp) => emp !== null && emp.isRetiringInFiscalYear)
      .sort((a, b) => a.sixtiethBirthday.getTime() - b.sixtiethBirthday.getTime());
    
    res.json(employeesWithAge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Only start server if running directly (not in serverless environment)
if (process.env.NODE_ENV !== 'serverless' && !process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
