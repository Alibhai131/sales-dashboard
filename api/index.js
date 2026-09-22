const app = require('../server');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
    try {
        await connectDB();
        return app(req, res);
    } catch (err) {
        console.error('Vercel Serverless Crash:', err);
        res.status(500).send(`
            <div style="padding: 2rem; font-family: monospace; background: #fff1f2; color: #9f1239; border-radius: 8px; margin: 2rem;">
                <h2>⚠️ Vercel Execution Error</h2>
                <p><strong>Error:</strong> ${err.message}</p>
                <pre style="background: #ffffff; padding: 1rem; border-radius: 6px; overflow-x: auto;">${err.stack}</pre>
            </div>
        `);
    }
};