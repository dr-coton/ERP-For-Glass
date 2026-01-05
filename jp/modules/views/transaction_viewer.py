import ttkbootstrap as ttk
from ttkbootstrap.constants import *
import sqlite3
from modules.db_manager import DB_PATH
from tkinter import messagebox

class TransactionViewer:
    def __init__(self, root, transaction_id):
        self.root = root
        self.transaction_id = transaction_id
        
        # 새 창 생성
        self.window = ttk.Toplevel(root)
        self.window.title("거래명세서 상세 보기")
        self.window.geometry("1000x800")
        
        # 메인 프레임
        self.main_frame = ttk.Frame(self.window, padding="20")
        self.main_frame.pack(fill=BOTH, expand=True)
        
        # 거래처 정보 프레임
        self.customer_frame = ttk.LabelFrame(self.main_frame, text="거래처 정보", padding="10")
        self.customer_frame.pack(fill=X, pady=(0, 20))
        
        # 거래처 정보 표시
        self.customer_info = ttk.Label(self.customer_frame, text="", font=("Helvetica", 12))
        self.customer_info.pack(anchor=W)
        
        # 항목 목록 프레임
        self.items_frame = ttk.LabelFrame(self.main_frame, text="거래 항목", padding="10")
        self.items_frame.pack(fill=BOTH, expand=True)
        
        # 트리뷰 생성
        columns = ("date", "product", "price_type", "width", "height", "quantity", "unit_price", "supply_price")
        self.tree = ttk.Treeview(
            self.items_frame,
            columns=columns,
            show="headings",
            selectmode="none"
        )
        
        # 컬럼 설정
        self.tree.heading("date", text="날짜")
        self.tree.heading("product", text="품목")
        self.tree.heading("price_type", text="단가 종류")
        self.tree.heading("width", text="가로")
        self.tree.heading("height", text="세로")
        self.tree.heading("quantity", text="수량")
        self.tree.heading("unit_price", text="단가")
        self.tree.heading("supply_price", text="공급가액")
        
        # 컬럼 너비 설정
        self.tree.column("date", width=100)
        self.tree.column("product", width=150)
        self.tree.column("price_type", width=100)
        self.tree.column("width", width=80)
        self.tree.column("height", width=80)
        self.tree.column("quantity", width=80)
        self.tree.column("unit_price", width=100)
        self.tree.column("supply_price", width=120)
        
        # 스크롤바
        scrollbar = ttk.Scrollbar(self.items_frame, orient=VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # 트리뷰와 스크롤바 배치
        self.tree.pack(side=LEFT, fill=BOTH, expand=True)
        scrollbar.pack(side=RIGHT, fill=Y)
        
        # 메모 프레임
        self.memo_frame = ttk.LabelFrame(self.main_frame, text="메모", padding="10")
        self.memo_frame.pack(fill=X, pady=(20, 0))
        
        self.memo_text = ttk.Text(self.memo_frame, height=3, wrap="word", state="disabled")
        self.memo_text.pack(fill=X)
        
        # 하단 버튼 프레임
        self.button_frame = ttk.Frame(self.main_frame)
        self.button_frame.pack(fill=X, pady=(20, 0))
        
        # 닫기 버튼
        self.close_btn = ttk.Button(
            self.button_frame,
            text="닫기",
            command=self.window.destroy,
            width=15
        )
        self.close_btn.pack(side=RIGHT)
        
        # 데이터 로드
        self.load_transaction_data()
    
    def load_transaction_data(self):
        """거래명세서 데이터 로드"""
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # 거래명세서 기본 정보 조회
            c.execute('''
                SELECT customer_name, total_amount, memo, created_at
                FROM transactions
                WHERE id = ?
            ''', (self.transaction_id,))
            transaction = c.fetchone()
            
            if transaction:
                self.customer_info.config(
                    text=f"거래처: {transaction[0]}\n"
                         f"총 금액: {transaction[1]:,}원\n"
                         f"작성일: {transaction[3]}"
                )
                
                # 메모 표시
                self.memo_text.config(state="normal")
                self.memo_text.delete(1.0, END)
                self.memo_text.insert(1.0, transaction[2] or "")
                self.memo_text.config(state="disabled")
                
                # 거래 항목 조회
                c.execute('''
                    SELECT date, product, price_type, width, height, 
                           quantity, unit_price, supply_price
                    FROM transaction_items
                    WHERE transaction_id = ?
                    ORDER BY date
                ''', (self.transaction_id,))
                items = c.fetchall()
                
                # 트리뷰에 항목 추가
                for item in items:
                    formatted_values = (
                        item[0],
                        item[1],
                        item[2],
                        item[3],
                        item[4],
                        item[5],
                        f"{item[6]:,}",
                        f"{item[7]:,}"
                    )
                    self.tree.insert('', 'end', values=formatted_values)
            
            conn.close()
            
        except Exception as e:
            messagebox.showerror("오류", f"데이터 로드 중 오류가 발생했습니다: {str(e)}") 