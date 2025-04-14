from pynput import mouse
from logger import Logger
import datetime
import sys

file_path = sys.argv[1]

logger = Logger(file_path)
last_mouse_time = datetime.datetime.now()

def on_mouse_move(x, y):
    global last_mouse_time
    current_time = datetime.datetime.now()
    time_diff_seconds = (current_time - last_mouse_time).total_seconds()
    if time_diff_seconds > 0.1:
        logger.save_logs("MOUSE_MOVE", {"x": x, "y": y})
        last_mouse_time = current_time


def on_mouse_click(x, y, button, pressed):
    if pressed:
        logger.save_logs("MOUSE_CLICK", {"x": x, "y": y, "button": str(button)})
    else:
        logger.save_logs("MOUSE_RELEASE", {"x": x, "y": y, "button": str(button)})

def on_mouse_scroll(x, y, dx, dy):
    logger.save_logs("MOUSE_SCROLL", {"x": x, "y": y, "dx": dx, "dy": dy})


mouse_listener = mouse.Listener(on_move=on_mouse_move, on_click=on_mouse_click, on_scroll=on_mouse_scroll)
mouse_listener.start()
mouse_listener.join()

