import os
import datetime
import json

class Logger:
    filename = ""

    def __init__(self, filename):
        self.filename = filename
        if not os.path.exists(self.filename):
            with open(self.filename, "w") as f:
                f.write("")

    def save_logs(self, event, optional_data=None):
        with open(self.filename, "a") as f:
            # Create a base log entry with the current timestamp
            log_entry = {"timestamp": round(datetime.datetime.now().timestamp() * 1000), "event": event}
            # If optional_data is provided, add it to the log entry
            if optional_data:
                for key, value in optional_data.items():
                    log_entry[key] = value
            # Write the log entry as a JSON string followed by a newline
            f.write(json.dumps(log_entry) + "\n")





