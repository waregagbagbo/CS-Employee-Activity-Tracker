import requests


"""event is what we want, payload is the future of what we might add, destination is the target"""

def webhook_dispatcher(event,payload, destination):  # create a method to handle the webhook
    if destination == 'slack':
        from slack import slack_trigger # do inline import to prevent circular module
        slack_trigger(payload)
    else:
        try:
            requests.post(destination,json=payload)
        except requests.exceptions.RequestException as e:
            print('Webhook dispatch failed {e}')



