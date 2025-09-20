import requests

# create a method to handle the webhook
"""event is what we want, payload is the future of what we might add, destination is the target"""

def webhook_dispatcher(event,payload, destination):
    if destination == 'slack':
        # do inline import to prevent circular module
        from slack import slack_trigger
        slack_trigger(payload)

    else:
        try:
            requests.post(destination,json=payload)
        except requests.exceptions.RequestException as e:
            print('Webhook dispatch failed {e}')

        

