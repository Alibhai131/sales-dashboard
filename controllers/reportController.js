const Sale = require('../models/Sale');
const Employee = require('../models/Employee');
const PDFDocument = require('pdfkit');
const { parse } = require('json2csv');

// Helper to get correct currency symbol
function getCurrencySymbol(curr) {
    const symbols = { USD: '$', GBP: '£', PKR: 'Rs ', INR: '₹', EUR: '€', AED: 'د.إ ' };
    return symbols[curr] || '$';
}

// 1. Load the Reports Dashboard Page
exports.getReports = async (req, res) => {
    try {
        const { dateFrom, dateTo, type, employee } = req.query;
        let query = { owner: req.user._id };

        // Apply Filters if user selected them
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                let end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        if (type) query.saleType = type;
        if (employee) query.employee = employee;

        // Fetch Data
        const sales = await Sale.find(query).sort({ createdAt: -1 });
        const employees = await Employee.find({ owner: req.user._id });
        const currencySymbol = getCurrencySymbol(req.user.currency);

        // Calculate Totals for the Top Cards
        let totalSales = 0, totalProfit = 0, totalCost = 0;
        sales.forEach(s => {
            totalSales += s.sellingPrice || 0;
            totalProfit += s.profit || 0;
            totalCost += s.costPrice || 0;
        });

        res.render('dashboard/reports', {
            title: 'Reports - Sales Dashboard',
            activePage: 'reports',
            pageTitle: 'Sales Reports',
            sales,
            employees,
            reportStats: { totalSales, totalProfit, totalCost, totalOrders: sales.length },
            currencySymbol
        });
    } catch (err) {
        console.error('Reports Page Error:', err);
        res.status(500).send('Error loading reports page.');
    }
};

// 2. Download Data as PDF
exports.downloadPDF = async (req, res) => {
    try {
        const { dateFrom, dateTo, type, employee } = req.query;
        let query = { owner: req.user._id };

        if (dateFrom) query.createdAt = { ...query.createdAt, $gte: new Date(dateFrom) };
        if (dateTo) {
            let end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { ...query.createdAt, $lte: end };
        }
        if (type) query.saleType = type;
        if (employee) query.employee = employee;

        const sales = await Sale.find(query).sort({ createdAt: -1 });
        const currencySymbol = getCurrencySymbol(req.user.currency);

        // Initialize PDF Document
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Tell Browser to Download it
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        doc.pipe(res);

        // --- PDF LAYOUT DESIGN ---
        doc.fontSize(22).font('Helvetica-Bold').text(req.user.shopName || 'Sales Dashboard Report', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Table Headers
        const startY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', 30, startY);
        doc.text('Product', 110, startY);
        doc.text('Qty', 280, startY);
        doc.text('Cost', 330, startY);
        doc.text('Selling Price', 410, startY);
        doc.text('Profit', 500, startY);
        
        doc.moveTo(30, startY + 15).lineTo(560, startY + 15).stroke(); // Draw Line

        // Table Rows
        let y = startY + 25;
        doc.font('Helvetica');
        let tCost = 0, tSell = 0, tProfit = 0;

        sales.forEach(sale => {
            if (y > 750) { doc.addPage(); y = 30; } // Add new page if full
            
            doc.text(new Date(sale.createdAt).toLocaleDateString(), 30, y);
            doc.text(sale.productName.substring(0, 30), 110, y);
            doc.text(sale.quantity.toString(), 280, y);
            doc.text(currencySymbol + sale.costPrice.toLocaleString(), 330, y);
            doc.text(currencySymbol + sale.sellingPrice.toLocaleString(), 410, y);
            
            // Color profit green if positive, red if negative
            doc.fillColor(sale.profit >= 0 ? 'green' : 'red')
               .text(currencySymbol + sale.profit.toLocaleString(), 500, y);
            doc.fillColor('black'); // reset color
            
            tCost += sale.costPrice; tSell += sale.sellingPrice; tProfit += sale.profit;
            y += 20;
        });

        doc.moveTo(30, y).lineTo(560, y).stroke();
        y += 15;

        // Final Totals Row
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('TOTALS:', 200, y);
        doc.text(currencySymbol + tCost.toLocaleString(), 330, y);
        doc.text(currencySymbol + tSell.toLocaleString(), 410, y);
        doc.fillColor(tProfit >= 0 ? 'green' : 'red')
           .text(currencySymbol + tProfit.toLocaleString(), 500, y);

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).send('Error generating PDF');
    }
};

// 3. Download Data as CSV (Excel)
exports.downloadCSV = async (req, res) => {
    try {
        const sales = await Sale.find({ owner: req.user._id }).sort({ createdAt: -1 });
        
        const csvData = sales.map(s => ({
            Date: new Date(s.createdAt).toLocaleDateString(),
            Product: s.productName,
            Quantity: s.quantity,
            Cost_Price: s.costPrice,
            Selling_Price: s.sellingPrice,
            Profit: s.profit,
            ROI_Percent: s.roi,
            Margin_Percent: s.profitMargin,
            Sale_Type: s.saleType,
            Employee: s.employeeName
        }));

        const csv = parse(csvData);
        res.header('Content-Type', 'text/csv');
        res.attachment(`Sales_Data_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (err) {
        console.error('CSV Generation Error:', err);
        res.status(500).send('Error generating CSV');
    }
};