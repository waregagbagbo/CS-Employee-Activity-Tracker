from django.conf import settings
from django.core.mail import send_mail

# create a function to handle the send mail
def shift_email_trigger(payload):
    subject = "Shift status Changes"
    message = payload.get('text','This shift changes reports')
    recipient_list =['denzrich10@gmail.com']

    try:
        send_mail(subject, message,recipient_list,from_email=settings.DEFAULT_FROM_EMAIL)
        print("Email sent successfully")
    except Exception as e:
        print(f'Email failed {e}')


