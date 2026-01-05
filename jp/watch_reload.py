# watch_reload.py
import time
import os
import sys
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ReloadHandler(FileSystemEventHandler):
    def __init__(self, script):
        self.script = script

    def on_modified(self, event):
        if event.src_path.endswith('.py'):
            print(f"{event.src_path}가 변경되었습니다. 프로그램을 리로드합니다.")
            os.execv(sys.executable, ['python'] + [self.script])

if __name__ == "__main__":
    script_to_run = 'main.py'  # 리로드할 스크립트 이름
    event_handler = ReloadHandler(script_to_run)
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=False)
    
    observer.start()
    print(f"{script_to_run}를 실행합니다.")
    os.system(f'python {script_to_run}')  # 초기 실행

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()