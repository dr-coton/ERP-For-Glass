# main.py
from modules.db_manager import init_db
import ttkbootstrap as ttk
from modules.views.main_window import MainWindow

def main():
    root = ttk.Window(
        title="거래명세서 관리 프로그램",
        themename="cosmo",
        resizable=(True, True)
    )
    
    # 화면 중앙에 위치하도록 설정
    window_width = 1024
    window_height = 768
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    center_x = int(screen_width/2 - window_width/2)
    center_y = int(screen_height/2 - window_height/2)
    
    root.geometry(f'{window_width}x{window_height}+{center_x}+{center_y}')
    
    # 최소 창 크기 설정
    root.minsize(800, 600)
    
    # 프로그램 아이콘 설정 (assets 폴더에 icon.ico 파일 필요)
    try:
        root.iconbitmap('assets/icon.ico')
    except:
        pass
    
    # 데이터베이스 초기화
    init_db()
    
    # 메인 윈도우 생성
    app = MainWindow(root)
    
    root.mainloop()

if __name__ == "__main__":
    main()
