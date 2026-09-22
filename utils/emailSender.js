const { sendEmail } = require('../config/email');

const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to Sales Dashboard!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Hello ${user.name}!</h2>
        <p>Your account has been created successfully. Please wait for admin approval to start using the dashboard.</p>
        <p>You'll receive an email once your account is approved.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL}/login" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Login to Dashboard</a>
        </div>
      </div>
      <div style="background: #333; color: #aaa; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
        <p>Sales Dashboard &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
  return sendEmail(user.email, 'Welcome to Sales Dashboard', html);
};

const sendApprovalEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Account Approved!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Hello ${user.name}!</h2>
        <p>Great news! Your account has been approved. You can now access all features of the Sales Dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL}/login" style="background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Go to Dashboard</a>
        </div>
      </div>
    </div>
  `;
  return sendEmail(user.email, 'Account Approved - Sales Dashboard', html);
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.BASE_URL}/reset-password/${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Password Reset</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Hello ${user.name}!</h2>
        <p>You requested a password reset. Click the button below to reset your password.</p>
        <p>This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail(user.email, 'Password Reset - Sales Dashboard', html);
};

const sendSubscriptionEmail = async (user, type) => {
  let subject, content, bgColor;
  
  switch(type) {
    case 'expiring':
      subject = 'Subscription Expiring Soon';
      content = 'Your subscription is expiring soon. Please renew to continue using all features.';
      bgColor = '#f39c12';
      break;
    case 'expired':
      subject = 'Subscription Expired';
      content = 'Your subscription has expired. Your data is safe but you can only view it in read-only mode. Please contact admin to renew.';
      bgColor = '#e74c3c';
      break;
    case 'blocked':
      subject = 'Access Blocked';
      content = 'Your access has been blocked by the administrator. Please contact admin.';
      bgColor = '#c0392b';
      break;
    case 'renewed':
      subject = 'Subscription Renewed';
      content = 'Your subscription has been renewed successfully. You now have full access to all features.';
      bgColor = '#27ae60';
      break;
    default:
      return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${bgColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${subject}</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Hello ${user.name}!</h2>
        <p>${content}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL}/login" style="background: ${bgColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Go to Dashboard</a>
        </div>
      </div>
    </div>
  `;
  return sendEmail(user.email, `${subject} - Sales Dashboard`, html);
};

const sendSaleNotification = async (user, sale) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">New Sale! 🎉</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Hello ${user.name}!</h2>
        <p>You just made a new sale!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Product:</strong> ${sale.productName}</p>
          <p><strong>Quantity:</strong> ${sale.quantity}</p>
          <p><strong>Revenue:</strong> ${sale.totalRevenue}</p>
          <p><strong>Profit:</strong> ${sale.profit}</p>
          <p><strong>Type:</strong> ${sale.saleType}</p>
        </div>
      </div>
    </div>
  `;
  return sendEmail(user.email, `New Sale: ${sale.productName} - Sales Dashboard`, html);
};

module.exports = {
  sendWelcomeEmail,
  sendApprovalEmail,
  sendPasswordResetEmail,
  sendSubscriptionEmail,
  sendSaleNotification
};