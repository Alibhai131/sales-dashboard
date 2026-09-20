const Sale = require('../models/Sale');
const puppeteer = require('puppeteer');

// Show reports page
exports.getReports = async (req, res) => {
    try {
        const sales = await Sale.find({ buyerId: req.session.user.id }).sort({ createdAt: -1 });
        res.render('dashboard/reports', { user: req.session.user, sales });
    } catch (err) {
        console.error(err);
        res.status(500).send('Reports Error');
    }
};

// Generate & Download PDF
exports.downloadPDF = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = req.session.user;
        const sales = await Sale.find({ buyerId: userId }).sort({ createdAt: -1 });

        let totalSales = 0, totalInvestment = 0, totalProfit = 0;
        sales.forEach(s => {
            totalSales += s.totalSales;
            totalInvestment += s.totalInvestment;
            totalProfit += s.profit;
        });
        const avgROI = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(2) : 0;

        // Build rows
        let rows = '';
        sales.forEach((s, i) => {
            rows += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${s.productName}</td>
                    <td>${s.quantity}</td>
                    <td>${user.currency} ${s.totalInvestment}</td>
                    <td>${user.currency} ${s.totalSales}</td>
                    <td style="color:green;">${user.currency} ${s.profit}</td>
                    <td>${s.roiPercentage}%</td>
                    <td>${s.paymentStatus}</td>
                    <td>${new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        });

        const htmlContent = `
        <html>
        <head>
            <style>
                body { font-family: Arial; padding: 30px; color: #333; }
                .header { text-align: center; border-bottom: 3px solid #7380ec; padding-bottom: 15px; margin-bottom: 20px; }
                .header h1 { color: #7380ec; margin: 0; }
                .summary { display: flex; justify-content: space-around; margin: 20px 0; }
                .summary-box { background: #f6f6f9; padding: 15px 25px; border-radius: 10px; text-align: center; }
                .summary-box h3 { margin: 0; color: #7d8da1; font-size: 12px; }
                .summary-box p { margin: 5px 0 0; font-size: 18px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #7380ec; color: white; padding: 10px; font-size: 12px; }
                td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 11px; text-align: center; }
                .footer { text-align: center; margin-top: 30px; color: #7d8da1; font-size: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SALES PRO - Sales Report</h1>
                <p>${user.name} | Generated: ${new Date().toLocaleString()}</p>
            </div>

            <div class="summary">
                <div class="summary-box"><h3>TOTAL SALES</h3><p>${user.currency} ${totalSales.toLocaleString()}</p></div>
                <div class="summary-box"><h3>INVESTMENT</h3><p>${user.currency} ${totalInvestment.toLocaleString()}</p></div>
                <div class="summary-box"><h3>NET PROFIT</h3><p style="color:green;">${user.currency} ${totalProfit.toLocaleString()}</p></div>
                <div class="summary-box"><h3>AVG ROI</h3><p>${avgROI}%</p></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th><th>Product</th><th>Qty</th><th>Investment</th>
                        <th>Sold For</th><th>Profit</th><th>ROI</th><th>Status</th><th>Date</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>

            <div class="footer">
                <p>This is a computer-generated report by SALES PRO Dashboard. &copy; ${new Date().getFullYear()}</p>
            </div>
        </body>
        </html>
        `;

        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=SalesReport_${Date.now()}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating PDF: ' + err.message);
    }
};