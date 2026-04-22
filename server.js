import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const PORT = 3001;

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

// Get all employees with pagination
app.get('/api/employees', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.collection('employees')
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('employees').countDocuments({})
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
        birthDate: values[4] || '',
        phone: values[5] || '',
        address: values[6] || '',
        startDate: values[7] || now,
        endDate: values[8] || null,
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

    const result = await db.collection('employees').insertMany(employees);
    
    res.json({
      message: 'Employees imported successfully',
      importedCount: result.insertedCount,
      employees: result.insertedIds.map(id => id.toString())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    
    const employees = await db.collection('employees')
      .find({ status: 'active' })
      .toArray();
    
    const now = new Date();
    const retiringSoonCount = employees.filter((emp) => {
      const birthDate = new Date(emp.birthDate);
      const retirementDate = new Date(birthDate);
      retirementDate.setFullYear(retirementDate.getFullYear() + 60);
      const monthsUntilRetirement = Math.floor(
        (retirementDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      return monthsUntilRetirement >= 0 && monthsUntilRetirement <= 6;
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
        
        const birthDate = new Date(employee.birthDate);
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
      .filter((emp) => emp.isRetiringInFiscalYear)
      .sort((a, b) => a.sixtiethBirthday.getTime() - b.sixtiethBirthday.getTime());
    
    res.json(employeesWithAge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
