const Employee = require('../models/Employee');

// GET all employees for logged-in buyer
exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, employees, count: employees.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET single employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findOne({ _id: req.params.id, owner: req.user._id });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
        res.json({ success: true, employee });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST Create new employee (ENFORCES MAX 10 LIMIT)
exports.createEmployee = async (req, res) => {
    try {
        const count = await Employee.countDocuments({ owner: req.user._id });
        if (count >= 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Limit reached! You can only store data for up to 10 employees.' 
            });
        }

        const { name, role, phone } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Employee name is required' });
        }

        const employee = await Employee.create({
            name: name.trim(),
            role: role ? role.trim() : 'Sales Associate',
            phone: phone ? phone.trim() : '',
            owner: req.user._id
        });

        res.status(201).json({ success: true, employee, message: 'Employee added successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT Update employee
exports.updateEmployee = async (req, res) => {
    try {
        const { name, role, phone } = req.body;
        const employee = await Employee.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $set: { name, role, phone } },
            { new: true }
        );

        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
        res.json({ success: true, employee, message: 'Employee updated!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE Employee
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
        res.json({ success: true, message: 'Employee deleted!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};