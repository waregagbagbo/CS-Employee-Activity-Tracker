#import requests
"""event is what we want, payload is the future of what we might add, destination is the target"""

"""def webhook_dispatcher(event,payload, destinations):  # create a method to handle the webhook
    if isinstance(destinations, dict):
        destinations = [destinations]

    for destination in destinations:
       if destination == 'slack':
           from .slack import slack_trigger # do inline import to prevent circular module
           slack_trigger(payload)

       elif destination == 'email':
           from .webhook_email import shift_email_trigger
           shift_email_trigger(payload)
       else:
           try:
               requests.post()
           except requests.exceptions.RequestException as e:
               print(f'Webhook failed {e}')"""










