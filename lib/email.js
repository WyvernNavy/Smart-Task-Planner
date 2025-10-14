import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: `"Smart Task Planner" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Smart Task Planner',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to Smart Task Planner!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>This code will expire in 10 minutes.</strong></p>
            
            <p>If you didn't request this code, please ignore this email.</p>
            
            <p>Best regards,<br>Smart Task Planner Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }
}

export async function sendWelcomeEmail(email) {
  const mailOptions = {
    from: `"Smart Task Planner" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Smart Task Planner! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #667eea; border-radius: 4px; }
          .cta { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome Aboard!</h1>
          </div>
          <div class="content">
            <p>Congratulations! Your email has been verified successfully.</p>
            
            <p>You now have access to our AI-powered task planning features:</p>
            
            <div class="feature">
              <strong>🤖 AI-Powered Planning</strong><br>
              Break down complex goals into actionable tasks using Google's Gemini AI
            </div>
            
            <div class="feature">
              <strong>📊 Visual Timelines</strong><br>
              See your tasks laid out in an interactive timeline chart
            </div>
            
            <div class="feature">
              <strong>🔗 Task Dependencies</strong><br>
              Understand how tasks relate to each other
            </div>
            
            <div class="feature">
              <strong>🎨 Personalization</strong><br>
              Choose between dark and light themes
            </div>
            
            <div class="cta">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">Start Planning Now →</a>
            </div>
            
            <p>Need help getting started? Simply enter your goal and let our AI break it down into manageable tasks!</p>
            
            <p>Happy planning!<br>Smart Task Planner Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Welcome email error:', error)
    // Don't throw error for welcome email - it's not critical
    return false
  }
}
