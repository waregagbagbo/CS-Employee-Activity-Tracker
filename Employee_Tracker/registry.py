# this module maps events to destinations and formatters
""" Shift is model instance used so that it get the payload body"""
EVENTS = {
    'shift_status_changed': {
        'destination': ('slack','email'),
        'formatter': lambda shift: {
            "text": f"🔔 Shift status changed for *{shift.shift_agent}*: `{shift.previous_status}` → `{shift.status}`"
        }
    }
}