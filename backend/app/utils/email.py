import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_otp_email(email_to: str, otp: str):
    """Send OTP email via SMTP."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print("SMTP settings not configured, skipping email.")
        return False
        
    try:
        message = MIMEMultipart()
        message["From"] = f"{settings.APP_NAME} <{settings.MAIL_FROM}>"
        message["To"] = email_to
        message["Subject"] = f"Your {settings.APP_NAME} Verification Code: {otp}"
        
        body = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #1f883d;">Verify your email</h2>
                    <p>Hello,</p>
                    <p>Thank you for choosing <strong>SmartApply.AI</strong>. Use the following code to complete your verification process:</p>
                    <div style="background: #f6f8fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #1f2328;">{otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #57606a;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #8b949e;">&copy; 2024 SmartApply.AI. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
            
        print(f"SUCCESS: OTP sent to {email_to}")
        return True
    except Exception as e:
        print(f"FAILURE sending email to {email_to}: {str(e)}")
        return False

def send_reset_email(email_to: str, otp: str):
    """Send Password Reset email via SMTP."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print("SMTP settings not configured, skipping email.")
        return False
        
    try:
        message = MIMEMultipart()
        message["From"] = f"{settings.APP_NAME} <{settings.MAIL_FROM}>"
        message["To"] = email_to
        message["Subject"] = f"Reset your {settings.APP_NAME} password"
        
        body = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #d73a49;">Reset your password</h2>
                    <p>We received a request to reset your password for <strong>SmartApply.AI</strong>.</p>
                    <p>Enter the following code in the app to proceed with setting a new password:</p>
                    <div style="background: #fff5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px solid #ffd8d8;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #cf222e;">{otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #57606a;">This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #8b949e;">&copy; 2024 SmartApply.AI. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
            
        print(f"SUCCESS: Reset code sent to {email_to}")
        return True
    except Exception as e:
        print(f"FAILURE sending reset email to {email_to}: {str(e)}")
        return False
