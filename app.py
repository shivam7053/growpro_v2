from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Email configuration
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
NEXT_PUBLIC_BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL')
CRON_SECRET = os.getenv('CRON_SECRET')

# Initialize Firebase Admin with lazy loading
db = None

def get_db():
    """Lazy load Firestore client"""
    global db
    if db is None:
        try:
            if not firebase_admin._apps:
                firebase_config = json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT'))
                cred = credentials.Certificate(firebase_config)
                firebase_admin.initialize_app(cred)
            db = firestore.client()
        except Exception as e:
            print(f"Error initializing Firebase: {str(e)}")
            raise
    return db

# Email configuration
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
NEXT_PUBLIC_BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL')
CRON_SECRET = os.getenv('CRON_SECRET')

def send_email(to_email, subject, html_content):
    """Send email using SMTP with retry logic"""
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f'"GrowPro" <{EMAIL_USER}>'
            msg['To'] = to_email
            msg['Subject'] = subject
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Try SMTP_SSL first (port 465)
            try:
                with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30) as server:
                    server.login(EMAIL_USER, EMAIL_PASSWORD)
                    server.send_message(msg)
                return True
            except Exception as ssl_error:
                print(f"SMTP_SSL failed: {ssl_error}, trying STARTTLS...")
                # Fallback to STARTTLS (port 587)
                with smtplib.SMTP('smtp.gmail.com', 587, timeout=30) as server:
                    server.starttls()
                    server.login(EMAIL_USER, EMAIL_PASSWORD)
                    server.send_message(msg)
                return True
                
        except Exception as e:
            print(f"Error sending email (attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt < max_retries - 1:
                import time
                time.sleep(retry_delay)
            else:
                print(f"Failed to send email after {max_retries} attempts")
                return False
    
    return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "service": "email-service"
    })

@app.route('/api/cron/send-reminders', methods=['GET'])
def send_reminders():
    """Cron job to send masterclass reminders"""
    # Verify cron secret
    auth_header = request.headers.get('Authorization')
    if auth_header != f'Bearer {CRON_SECRET}':
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        db = get_db()  # Lazy load database
        now = datetime.now()
        
        # Define time windows for reminders
        in_24_hours_start = now + timedelta(hours=23)
        in_24_hours_end = now + timedelta(hours=25)
        in_2_hours_start = now + timedelta(hours=1.5)
        in_2_hours_end = now + timedelta(hours=2.5)
        
        # Get all upcoming masterclasses
        masterclasses_ref = db.collection('MasterClasses')
        masterclasses = masterclasses_ref.stream()
        
        emails_sent = {
            'reminder24h': 0,
            'reminder2h': 0,
            'errors': 0,
            'skipped': 0
        }
        
        processed_classes = []
        
        for doc in masterclasses:
            data = doc.to_dict()
            masterclass_id = doc.id
            
            # Only process upcoming masterclasses with scheduled dates
            if data.get('type') != 'upcoming' or not data.get('scheduled_date'):
                continue
            
            scheduled_date = datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00'))
            
            # Skip if event has already passed
            if scheduled_date < now:
                print(f"Skipping past event: {data.get('title')}")
                continue
            
            # Initialize reminder tracking
            reminders_sent = data.get('remindersSent', {})
            
            # Check if we should send 24-hour reminder
            should_send_24h = (
                in_24_hours_start <= scheduled_date <= in_24_hours_end and
                not reminders_sent.get('24h')
            )
            
            # Check if we should send 2-hour reminder
            should_send_2h = (
                in_2_hours_start <= scheduled_date <= in_2_hours_end and
                not reminders_sent.get('2h')
            )
            
            if not should_send_24h and not should_send_2h:
                continue
            
            # Get registered users
            joined_users = data.get('joined_users', [])
            
            if len(joined_users) == 0:
                print(f"No registered users for: {data.get('title')}")
                continue
            
            print(f"Processing {data.get('title')} - {len(joined_users)} users")
            processed_classes.append(data.get('title'))
            
            success_count = 0
            
            for user_id in joined_users:
                try:
                    # Get user details
                    user_doc = db.collection('user_profiles').document(user_id).get()
                    if not user_doc.exists:
                        print(f"User not found: {user_id}")
                        emails_sent['skipped'] += 1
                        continue
                    
                    user_data = user_doc.to_dict()
                    user_email = user_data.get('email')
                    user_name = user_data.get('name') or user_data.get('displayName') or ''
                    
                    if not user_email:
                        print(f"No email for user: {user_id}")
                        emails_sent['skipped'] += 1
                        continue
                    
                    # Send appropriate reminder
                    if should_send_24h:
                        html = get_24_hour_reminder_html(user_name, data, masterclass_id)
                        if send_email(user_email, f"⏰ Tomorrow: {data.get('title')}", html):
                            success_count += 1
                            emails_sent['reminder24h'] += 1
                            print(f"✅ 24h reminder sent to: {user_email}")
                    elif should_send_2h:
                        html = get_2_hour_reminder_html(user_name, data, masterclass_id)
                        if send_email(user_email, f"🚨 STARTING IN 2 HOURS: {data.get('title')}", html):
                            success_count += 1
                            emails_sent['reminder2h'] += 1
                            print(f"✅ 2h reminder sent to: {user_email}")
                
                except Exception as e:
                    print(f"Error sending email to user {user_id}: {str(e)}")
                    emails_sent['errors'] += 1
            
            # Update reminder tracking in Firestore
            if success_count > 0:
                try:
                    update_data = {}
                    if should_send_24h:
                        update_data['remindersSent.24h'] = True
                        update_data['remindersSent.24h_timestamp'] = datetime.now().isoformat()
                    if should_send_2h:
                        update_data['remindersSent.2h'] = True
                        update_data['remindersSent.2h_timestamp'] = datetime.now().isoformat()
                    
                    db.collection('MasterClasses').document(masterclass_id).update(update_data)
                    print(f"✅ Updated reminder tracking for: {data.get('title')}")
                except Exception as e:
                    print(f"Error updating reminder tracking: {str(e)}")
        
        return jsonify({
            'success': True,
            **emails_sent,
            'processedClasses': processed_classes,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Cron job error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/send-purchase-confirmation', methods=['POST'])
def send_purchase_confirmation():
    """Send purchase confirmation email"""
    try:
        data = request.json
        
        email = data.get('email')
        user_name = data.get('userName', '')
        masterclass_title = data.get('masterclassTitle')
        video_title = data.get('videoTitle')
        amount = data.get('amount', 0)
        order_id = data.get('orderId')
        payment_id = data.get('paymentId')
        masterclass_id = data.get('masterclassId')
        video_id = data.get('videoId')
        purchase_type = data.get('purchaseType')
        
        if not email or not masterclass_title:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        is_paid = amount > 0
        is_video = purchase_type == 'video'
        is_upcoming = purchase_type == 'upcoming_registration'
        
        html_content = get_purchase_confirmation_html(
            user_name, masterclass_title, video_title, amount, order_id, 
            payment_id, masterclass_id, video_id, is_paid, is_video, is_upcoming
        )
        
        subject = f"{'💳' if is_paid else '✅'} {'Video' if is_video else 'Masterclass'} {'Purchase' if is_paid else 'Enrollment'} Confirmed - {video_title if is_video else masterclass_title}"
        
        if send_email(email, subject, html_content):
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to send email'}), 500
    
    except Exception as e:
        print(f"Purchase confirmation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/send-registration-email', methods=['POST'])
def send_registration_email():
    """Send registration confirmation email"""
    try:
        data = request.json
        
        email = data.get('email')
        masterclass_title = data.get('masterclassTitle')
        speaker_name = data.get('speakerName')
        scheduled_date = data.get('scheduledDate')
        masterclass_id = data.get('masterclassId')
        user_name = data.get('userName', '')
        
        if not email or not masterclass_title:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        scheduled_datetime = datetime.fromisoformat(scheduled_date.replace('Z', '+00:00')) if scheduled_date else None
        now = datetime.now()
        
        # Calculate time difference
        if scheduled_datetime:
            time_diff = (scheduled_datetime - now).total_seconds()
            hours_until_event = time_diff / 3600
        else:
            hours_until_event = float('inf')
        
        needs_immediate_reminder = hours_until_event <= 2
        
        html_content = get_registration_email_html(
            user_name, masterclass_title, speaker_name, 
            scheduled_datetime, masterclass_id, hours_until_event,
            needs_immediate_reminder
        )
        
        subject = f"✅ Registration Confirmed: {masterclass_title}"
        
        if send_email(email, subject, html_content):
            # Send immediate reminder if needed
            if needs_immediate_reminder and scheduled_datetime:
                immediate_html = get_immediate_reminder_html(
                    user_name, masterclass_title, speaker_name,
                    scheduled_datetime, masterclass_id, hours_until_event
                )
                send_email(email, f"🚨 STARTING NOW: {masterclass_title}", immediate_html)
            
            return jsonify({
                'success': True,
                'immediateReminderSent': needs_immediate_reminder
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to send email'}), 500
    
    except Exception as e:
        print(f"Registration email error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def get_24_hour_reminder_html(user_name, masterclass, masterclass_id):
    """Generate 24-hour reminder HTML"""
    scheduled_date = datetime.fromisoformat(masterclass['scheduled_date'].replace('Z', '+00:00'))
    formatted_date = scheduled_date.strftime('%A, %B %d, %Y at %I:%M %p %Z')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; }}
        .content {{ padding: 30px; }}
        .button {{ display: inline-block; background: #4f46e5; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }}
        .highlight {{ background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }}
        .highlight h3 {{ margin-top: 0; color: #92400e; }}
        .checklist {{ background: #f0fdf4; padding: 15px 20px; border-radius: 8px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 14px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Reminder: Tomorrow!</h1>
          <p style="font-size: 20px; margin: 10px 0;">Your masterclass is in 24 hours</p>
        </div>
        <div class="content">
          <h2>Hi {user_name or "there"}!</h2>
          <p>This is a friendly reminder that your registered masterclass is starting <strong>tomorrow</strong>!</p>
          
          <div class="highlight">
            <h3>📚 {masterclass.get('title')}</h3>
            <p><strong>Speaker:</strong> {masterclass.get('speaker_name')}</p>
            <p><strong>📅 Date & Time:</strong> {formatted_date}</p>
          </div>

          <div class="checklist">
            <p><strong>📝 What to do now:</strong></p>
            <ul>
              <li>📅 Add to your calendar if you haven't already</li>
              <li>📝 Prepare any questions you'd like to ask</li>
              <li>🔔 Enable notifications to get the join link</li>
              <li>☕ Set a reminder for 2 hours before</li>
              <li>✅ Test your internet connection</li>
            </ul>
          </div>

          <center>
            <a href="{NEXT_PUBLIC_BASE_URL}/masterclasses/{masterclass_id}" class="button">View Event Details</a>
          </center>

          <p style="text-align: center; margin-top: 30px; color: #6b7280;">💡 You'll receive another reminder 2 hours before the event starts with the join link.</p>
          
          <p>See you tomorrow!</p>
          <p>Best regards,<br><strong>The Masterclass Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated reminder. You registered for this event.</p>
          <p>&copy; {datetime.now().year} Masterclass Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

def get_2_hour_reminder_html(user_name, masterclass, masterclass_id):
    """Generate 2-hour reminder HTML"""
    scheduled_date = datetime.fromisoformat(masterclass['scheduled_date'].replace('Z', '+00:00'))
    access_link = f"{NEXT_PUBLIC_BASE_URL}/masterclasses/{masterclass_id}/live"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; }}
        .content {{ padding: 30px; }}
        .button {{ display: inline-block; background: #ef4444; color: white !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3); }}
        .urgent {{ background: #fef2f2; padding: 20px; border-radius: 8px; border: 2px solid #ef4444; margin: 20px 0; }}
        .urgent h3 {{ margin-top: 0; color: #dc2626; }}
        .checklist {{ background: #f9fafb; padding: 15px 20px; border-radius: 8px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 14px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Starting in 2 Hours!</h1>
          <p style="font-size: 20px; margin: 10px 0;">Get Ready to Join</p>
        </div>
        <div class="content">
          <h2>Hi {user_name or "there"}!</h2>
          <p>Your masterclass is starting in just <strong>2 hours</strong>! It's time to get ready.</p>
          
          <div class="urgent">
            <h3>📚 {masterclass.get('title')}</h3>
            <p><strong>Speaker:</strong> {masterclass.get('speaker_name')}</p>
            <p><strong>⏰ Starting at:</strong> {scheduled_date.strftime('%I:%M %p %Z')}</p>
          </div>

          <center>
            <a href="{access_link}" class="button">🔴 JOIN THE MASTERCLASS</a>
          </center>

          <div class="checklist">
            <p><strong>✅ Quick Checklist:</strong></p>
            <ul>
              <li>✅ Stable internet connection</li>
              <li>✅ Notebook ready for taking notes</li>
              <li>✅ Questions prepared to ask</li>
              <li>✅ Quiet environment secured</li>
              <li>✅ Notifications enabled</li>
            </ul>
          </div>

          <p style="text-align: center; background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">💡 <strong>Pro Tip:</strong> Join 5 minutes early to test your connection and get settled!</p>

          <p style="text-align: center; margin-top: 30px;">See you in 2 hours!</p>
          <p>Best regards,<br><strong>The Masterclass Team</strong></p>
        </div>
        <div class="footer">
          <p>Having trouble joining? Contact us at {EMAIL_USER}</p>
          <p>&copy; {datetime.now().year} Masterclass Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

def get_purchase_confirmation_html(user_name, masterclass_title, video_title, amount, 
                                   order_id, payment_id, masterclass_id, video_id, 
                                   is_paid, is_video, is_upcoming):
    """Generate purchase confirmation HTML"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; }}
        .container {{ background: white; margin: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }}
        .content {{ padding: 30px; }}
        .purchase-details {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
        .amount {{ font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }}
        .button {{ display: inline-block; background: #4f46e5; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }}
        .receipt {{ background: #f0fdf4; padding: 15px; border-radius: 8px; font-size: 14px; color: #166534; }}
        .footer {{ text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 14px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ {'Purchase Successful!' if is_paid else 'Enrollment Confirmed!'}</h1>
          <p>{'Thank you for your purchase!' if is_paid else 'You have successfully enrolled!'}</p>
        </div>
        <div class="content">
          <h2>Hi {user_name or "there"}!</h2>
          <p>{'Your payment has been processed successfully.' if is_paid else 'Great news! Your enrollment is complete.'}</p>
          
          <div class="purchase-details">
            <h3>{'🎥' if is_video else '📚'} {video_title if is_video else masterclass_title}</h3>
            {f'<p><strong>Masterclass:</strong> {masterclass_title}</p>' if is_video else ''}
            {f'<div class="amount">₹{amount}</div>' if is_paid else '<p style="text-align: center; font-size: 18px; color: #10b981; font-weight: bold;">FREE</p>'}
          </div>

          {f'''
          <div class="receipt">
            <strong>📄 Payment Details:</strong><br>
            Order ID: {order_id}<br>
            {f'Payment ID: {payment_id}<br>' if payment_id else ''}
            Amount: ₹{amount}<br>
            Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
          </div>
          ''' if is_paid else ''}

          <p><strong>What's next?</strong></p>
          <ul>
            {'<li>✅ You will receive reminder emails before the event</li><li>🔗 Join link will be sent 2 hours before</li>' if is_upcoming else '<li>✅ Access your content immediately</li><li>📺 Watch anytime, anywhere</li>'}
            <li>💬 Interact with the content</li>
            <li>📧 Keep this email for your records</li>
          </ul>

          <center>
            <a href="{NEXT_PUBLIC_BASE_URL}/masterclasses/{masterclass_id}" class="button">
              {'View Event Details' if is_upcoming else 'Start Learning Now'}
            </a>
          </center>

          <p>Thank you for being part of our learning community!</p>
          <p>Best regards,<br><strong>The Masterclass Team</strong></p>
        </div>
        <div class="footer">
          <p>Need help? Contact us at {EMAIL_USER}</p>
          <p>&copy; {datetime.now().year} Masterclass Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

def get_registration_email_html(user_name, masterclass_title, speaker_name, 
                                scheduled_datetime, masterclass_id, hours_until_event,
                                needs_immediate_reminder):
    """Generate registration email HTML"""
    formatted_date = scheduled_datetime.strftime('%A, %B %d, %Y at %I:%M %p %Z') if scheduled_datetime else 'TBA'
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; }}
        .container {{ background: white; margin: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; }}
        .content {{ padding: 30px; }}
        .button {{ display: inline-block; background: #4f46e5; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }}
        .info-box {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5; }}
        .info-box h3 {{ margin-top: 0; color: #1f2937; }}
        .urgent-box {{ background: #fef2f2; border-left-color: #ef4444; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }}
        .urgent-box h3 {{ color: #dc2626; margin-top: 0; }}
        .checklist {{ background: #f0fdf4; padding: 15px 20px; border-radius: 8px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 14px; }}
        .highlight {{ color: #4f46e5; font-weight: bold; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Registration Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hello {user_name or "there"}!</h2>
          <p>Great news! You're all set for the upcoming masterclass.</p>
          
          <div class="info-box">
            <h3>📚 {masterclass_title}</h3>
            <p><strong>Speaker:</strong> {speaker_name}</p>
            <p><strong>📅 Scheduled:</strong> {formatted_date}</p>
          </div>

          {'''
          <div class="urgent-box">
            <h3>⚠️ Starting Soon!</h3>
            <p>This masterclass is starting in less than 2 hours! Make sure you're ready to join.</p>
          </div>
          ''' if needs_immediate_reminder else '''
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>✅ Your registration is confirmed</li>
            <li>📧 You'll receive a reminder email <strong>24 hours</strong> before the class</li>
            <li>🔔 Another reminder will be sent <strong>2 hours</strong> before start time</li>
            <li>🔗 The join link will be included in the reminder emails</li>
            <li>💬 Q&A session will be available during the class</li>
          </ul>
          '''}

          <div class="checklist">
            <strong>📝 Preparation Checklist:</strong>
            <ul>
              <li>📅 Add this event to your calendar</li>
              <li>✅ Test your internet connection beforehand</li>
              <li>📝 Prepare any questions you'd like to ask</li>
              <li>🎧 Have a quiet space ready for the session</li>
            </ul>
          </div>

          <center>
            <a href="{NEXT_PUBLIC_BASE_URL}/masterclasses/{masterclass_id}" class="button">View Masterclass Details</a>
          </center>

          {f'<p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">🕐 Time until event: <span class="highlight">{int(hours_until_event)} hours</span></p>' if scheduled_datetime else ''}
          
          <p>If you have any questions, feel free to reach out to us.</p>
          <p>Best regards,<br><strong>The Masterclass Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; {datetime.now().year} Masterclass Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

def get_immediate_reminder_html(user_name, masterclass_title, speaker_name,
                                scheduled_date, masterclass_id, hours_until_event):
    """Generate immediate reminder HTML for events starting soon"""
    minutes_until_event = int(hours_until_event * 60)
    access_link = f"{NEXT_PUBLIC_BASE_URL}/masterclasses/{masterclass_id}/live"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; }}
        .container {{ background: white; margin: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }}
        .content {{ padding: 30px; }}
        .button {{ display: inline-block; background: #ef4444; color: white !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3); }}
        .urgent {{ background: #fef2f2; padding: 20px; border-radius: 8px; border: 2px solid #ef4444; margin: 20px 0; }}
        .checklist {{ background: #f9fafb; padding: 15px 20px; border-radius: 8px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Starting Very Soon!</h1>
          <p style="font-size: 24px; margin: 10px 0;">⏰ {minutes_until_event} minutes</p>
        </div>
        <div class="content">
          <h2>Hi {user_name or "there"}!</h2>
          <p>Your masterclass is starting in just <strong>{minutes_until_event} minutes</strong>! Get ready to join!</p>
          
          <div class="urgent">
            <h3>📚 {masterclass_title}</h3>
            <p><strong>Speaker:</strong> {speaker_name}</p>
            <p><strong>⏰ Starting at:</strong> {scheduled_date.strftime('%I:%M %p')}</p>
          </div>

          <center>
            <a href="{access_link}" class="button">🔴 JOIN NOW</a>
          </center>

          <div class="checklist">
            <p><strong>Quick checklist:</strong></p>
            <ul>
              <li>✅ Stable internet connection</li>
              <li>✅ Notebook ready for notes</li>
              <li>✅ Questions prepared</li>
              <li>✅ Quiet environment</li>
            </ul>
          </div>

          <p style="text-align: center; margin-top: 30px;">See you in a few minutes!</p>
        </div>
      </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)