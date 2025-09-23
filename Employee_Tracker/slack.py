import requests

""" To create a slack trigger with the endpoint"""
EMAIL_WEBHOOK_URL = 'denzrich10@gmail.com'

# creat a function to handle the logic
def slack_trigger(payload):

    # create a message dict
    message = {
        'text': payload.get['text', 'Message triggered not yet received'],
    }
    # fallback in case the message is not executed

    try:
        requests.post(EMAIL_WEBHOOK_URL, json=message)
        return True
    except requests.exceptions.RequestException as e:
        print('Statuses failed: {e}')

