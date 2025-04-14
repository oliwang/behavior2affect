from pynput import mouse
from logger import Logger
import datetime

logger = Logger(f"log_mouse_{round(datetime.datetime.now().timestamp() * 1000)}.txt")
last_mouse_timestamp = 0

def on_mouse_move(x, y):
    global last_mouse_timestamp
    if datetime.datetime.now().timestamp() - last_mouse_timestamp > 1:
        logger.save_logs("MOUSE_MOVE", {"x": x, "y": y})
        last_mouse_timestamp = datetime.datetime.now().timestamp()


def on_mouse_click(x, y, button, pressed):
    logger.save_logs("MOUSE_CLICK", {"x": x, "y": y, "button": str(button), "pressed": pressed})

def on_mouse_scroll(x, y, dx, dy):
    logger.save_logs("MOUSE_SCROLL", {"x": x, "y": y, "dx": dx, "dy": dy})


mouse_listener = mouse.Listener(on_move=on_mouse_move, on_click=on_mouse_click, on_scroll=on_mouse_scroll)
mouse_listener.start()
mouse_listener.join()

