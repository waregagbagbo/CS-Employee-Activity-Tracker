# this module maps events to destinations and formatters
""" Shift is model instance used so that it get the payload body"""
EVENTS = {
    'shift_status_changed': {
        'destination': 'slack',
        'formatter': lambda shift: {
            "text": f"🔔 Shift status changed for *{shift.user.username}*: `{shift.previous_status}` → `{shift.status}`"
        }
    }
}