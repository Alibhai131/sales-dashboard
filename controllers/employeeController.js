const Employee = require('../models/Employee');
const User = require('../models/User');

// Get all employees for this buyer
exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ buyerId: req.session.user.id });
        res.render('dashboard/employees', {
            user: req.session.user,
            employees,
            error: null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading workers');
    }
};

// Add Employee (Max 10)
exports.postAddEmployee = async (req, res) => {
    try {
        const currentCount = await Employee.countDocuments({ buyerId: req.session.user.id });
        
        if (currentCount >= 10) {
            const employees = await Employee.find({ buyerId: req.session.user.id });
            return res.render('dashboard/employees', {
                user: req.session.user,
                employees,
                error: 'Limit reached! You can only store up to 10 worker profiles.'
            });
        }

        const { name, roleTitle, phone } = req.body;
        const employee = new Employee({
            buyerId: req.session.user.id,
            name,
            roleTitle: roleTitle || 'Salesperson',
            phone
        });

        await employee.save();
        res.redirect('/employees');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding worker');
    }
};