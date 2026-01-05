import ttkbootstrap as ttk
from ttkbootstrap.constants import *
import sqlite3
from tkinter import messagebox
from modules.db_manager import DB_PATH
from datetime import datetime
import math  # math 모듈 추가

class TransactionManager:
    def __init__(self, root, main_window, transaction_id=None):  # transaction_id 파라미터 추가
        self.root = root
        self.main_window = main_window
        self.transaction_id = transaction_id  # transaction_id 저장
        self.items = []
        
        # 새 창 생성
        self.window = ttk.Toplevel(root)
        self.window.title("거래명세서 수정" if transaction_id else "새 거래명세서")  # 제목 동적 설정
        self.window.geometry("1200x800")
        
        # 메인 프레임 생성
        self.frame = ttk.Frame(self.window, padding="10")
        self.frame.pack(fill=BOTH, expand=True)
        
        # 상단 프레임 (거래처 선택)
        self.top_frame = ttk.LabelFrame(self.frame, text="거래처 정보", padding="10")
        self.top_frame.pack(fill=X, pady=(0, 10))
        
        # 거래처 선택 프레임
        self.customer_frame = ttk.Frame(self.top_frame)
        self.customer_frame.pack(fill=X)
        
        self.customer_label = ttk.Label(self.customer_frame, text="거래처:", font=("Helvetica", 12))
        self.customer_label.pack(side=LEFT, padx=(0, 10))
        
        self.customer_combo = ttk.Combobox(self.customer_frame, state="readonly", width=40)  # 너비 증가
        self.customer_combo.pack(side=LEFT, padx=(0, 20))  # 패딩 증가
        self.load_customers()
        
        self.confirm_customer_btn = ttk.Button(
            self.customer_frame,
            text="거래처 확정",
            style="primary.TButton",
            width=15,  # 버튼 너비 설정
            command=self.confirm_customer
        )
        self.confirm_customer_btn.pack(side=LEFT)
        
        # 입력 폼과 목록을 담을 컨테이너
        self.content_frame = ttk.Frame(self.frame)
        self.content_frame.pack(fill=BOTH, expand=True)
        
        # 좌측 프레임 (입력 폼)
        self.left_frame = ttk.LabelFrame(self.content_frame, text="항목 입력", padding="10")
        self.left_frame.pack(side=LEFT, fill=Y, expand=False, padx=(0, 10))
        
        # 입력 필드들을 그룹화할 프레임
        input_fields = [
            ("날짜", self.create_date_input),
            ("상품", self.create_product_input),
            ("단가", self.create_price_input),
            ("규격", self.create_size_input),
            ("수량", self.create_quantity_input)
        ]
        
        for label, create_func in input_fields:
            group = ttk.LabelFrame(self.left_frame, text=label, padding="5")
            group.pack(fill=X, pady=(0, 5))
            create_func(group)
        
        # 항목 추가 버튼
        self.add_item_btn = ttk.Button(
            self.left_frame,
            text="항목 추가",
            style="success.TButton",
            command=self.add_item,
            width=20  # 버튼 너비 설정
        )
        self.add_item_btn.pack(fill=X, pady=(10, 0))
        
        # 우측 프레임 (항목 목록)
        self.right_frame = ttk.LabelFrame(self.content_frame, text="항목 목록", padding="10")
        self.right_frame.pack(side=LEFT, fill=BOTH, expand=True)
        
        # 트리뷰를 담을 프레임 추가
        self.tree_frame = ttk.Frame(self.right_frame)
        self.tree_frame.pack(fill=BOTH, expand=True)
        
        # 트리뷰 스타일 설정
        style = ttk.Style()
        style.configure("Treeview", rowheight=30)  # 행 높이를 30으로 설정
        style.configure("Treeview.Heading", font=('Helvetica', 11))  # 헤더 폰트 크기도 키움
        style.configure("Treeview", font=('Helvetica', 11))  # 내용 폰트 크기도 키움
        
        # 트리뷰 설정
        columns = ("date", "product", "price_type", "width", "height", "quantity", "unit_price", "supply_price")
        self.tree = ttk.Treeview(
            self.tree_frame,
            columns=columns,
            show="headings",
            selectmode="extended"
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
        
        # 트리뷰 스크롤바
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)  # 부모를 tree_frame으로 변경
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # 트리뷰와 스크롤바 배치
        self.tree.pack(side=LEFT, fill=BOTH, expand=True)
        scrollbar.pack(side=RIGHT, fill=Y)
        
        # 하단 버튼 프레임 - right_frame의 맨 아래에 배치
        self.bottom_frame = ttk.Frame(self.right_frame)
        self.bottom_frame.pack(fill=X, pady=(10, 0))
        
        # 합계 레이블
        self.total_label = ttk.Label(
            self.bottom_frame,
            text="총 공급가액: 0 원",
            font=("Helvetica", 12, "bold")
        )
        self.total_label.pack(side=LEFT, padx=20)
        
        # 선택 항목 삭제 버튼
        self.delete_btn = ttk.Button(
            self.bottom_frame,
            text="선택 항목 삭제",
            style="danger.TButton",
            width=15,
            command=self.delete_selected_items
        )
        self.delete_btn.pack(side=RIGHT, padx=(5, 0))
        
        # 저장 버튼
        self.save_btn = ttk.Button(
            self.bottom_frame,
            text="거래명세서 저장",
            style="primary.TButton",
            width=15,
            command=self.save_transaction
        )
        self.save_btn.pack(side=RIGHT, padx=(5, 0))
        
        # bottom_frame 위에 메모 프레임 추가
        self.memo_frame = ttk.LabelFrame(self.right_frame, text="메모", padding="5")
        self.memo_frame.pack(fill=X, pady=(10, 5))
        
        self.memo_text = ttk.Text(self.memo_frame, height=3)
        self.memo_text.pack(fill=X, padx=5, pady=5)
        
        # 기존 데이터 로드 (수정 모드인 경우)
        if self.transaction_id:
            self.load_transaction_data()
        
        # 트리뷰와 스크롤바 배치 코드 바로 위에 추가
        self.tree.bind('<Double-1>', self.on_double_click)
    
    def create_date_input(self, parent):
        self.date_entry = ttk.Entry(parent)
        self.date_entry.pack(fill=X, padx=5, pady=5)
        self.date_entry.insert(0, datetime.now().strftime("%Y-%m-%d"))
    
    def create_product_input(self, parent):
        self.product_combo = ttk.Combobox(parent, state="readonly")
        self.product_combo.pack(fill=X, padx=5, pady=5)
        self.load_products()
    
    def create_price_input(self, parent):
        price_types = ["제작가", "일면(500)", "양면(700)", "직매"]
        self.price_combo = ttk.Combobox(parent, state="readonly", values=price_types)
        self.price_combo.pack(fill=X, padx=5, pady=5)
    
    def create_size_input(self, parent):
        size_frame = ttk.Frame(parent)
        size_frame.pack(fill=X, padx=5, pady=5)
        
        ttk.Label(size_frame, text="가로:").pack(side=LEFT)
        self.width_entry = ttk.Entry(size_frame, width=10)
        self.width_entry.pack(side=LEFT, padx=(5, 10))
        
        ttk.Label(size_frame, text="세로:").pack(side=LEFT)
        self.height_entry = ttk.Entry(size_frame, width=10)
        self.height_entry.pack(side=LEFT, padx=(5, 0))
    
    def create_quantity_input(self, parent):
        self.quantity_entry = ttk.Entry(parent)
        self.quantity_entry.pack(fill=X, padx=5, pady=5)
    
    def confirm_customer(self):
        if not self.customer_combo.get():
            messagebox.showwarning("경고", "거래처를 선택하세요.")
            return
        
        # 거래처 선택을 확정하고 콤보박스와 확정 버튼을 비활성화
        self.customer_combo.configure(state="disabled")
        self.confirm_customer_btn.configure(state="disabled")
        
        # 입력 폼 활성화
        self.input_state(True)
    
    def input_state(self, enabled):
        """입력 폼의 활성화/비활성화 상태를 설정"""
        state = "normal" if enabled else "disabled"
        
        # 모든 입력 위젯의 상태 설정
        self.date_entry.configure(state=state)
        self.product_combo.configure(state="readonly" if enabled else "disabled")
        self.price_combo.configure(state="readonly" if enabled else "disabled")
        self.quantity_entry.configure(state=state)
        self.width_entry.configure(state=state)
        self.height_entry.configure(state=state)
        self.add_item_btn.configure(state=state)
    
    def add_item(self):
        try:
            # 거래처 선택 확인은 더 이상 필요 없음 (이미 확정된 상태)
            if not self.product_combo.get():
                raise ValueError("상품을 선택하세요.")
            # 입력값 검증
            if not self.price_combo.get():
                raise ValueError("적용 단가를 선택하세요.")
            if not self.date_entry.get():
                raise ValueError("날짜를 입력하세요.")
            
            # 날짜 형식 검증
            try:
                datetime.strptime(self.date_entry.get(), "%Y-%m-%d")
            except ValueError:
                raise ValueError("날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")
            
            # 가로, 세로를 정수로 변환
            try:
                width = int(float(self.width_entry.get()))
                height = int(float(self.height_entry.get()))
            except ValueError:
                raise ValueError("가로, 세로 값은 숫자여야 합니다.")
            
            quantity = int(self.quantity_entry.get())
            
            # 단가 계산
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            price_column = {
                "제작가": "production_price",
                "일면(500)": "single_side_price",
                "양면(700)": "double_side_price",
                "직매": "direct_price"
            }[self.price_combo.get()]
            
            c.execute(f'SELECT {price_column} FROM products WHERE name=?', (self.product_combo.get(),))
            base_price = c.fetchone()[0]
            conn.close()
            
            # 수정된 단가 계산 로직
            unit_price = base_price * width * height / 90000
            unit_price = int(math.floor(unit_price))  # 소수점 내림 처리
            supply_price = unit_price * quantity
            
            # 트리뷰에 항목 추가
            self.tree.insert('', 'end', values=(
                self.date_entry.get(),
                self.product_combo.get(),
                self.price_combo.get(),
                width,  # 정수로 변환된 가로 값
                height,  # 정수로 변환된 세로 값
                quantity,
                f"{unit_price:,}",  # 천단위 구분기호 추가
                f"{supply_price:,}"  # 천단위 구분기호 추가
            ))
            
            # 입력 필드 초기화 (날짜는 초기화하지 않음)
            self.width_entry.delete(0, END)
            self.height_entry.delete(0, END)
            self.quantity_entry.delete(0, END)
            
            # 합계 업데이트
            self.update_total()
            
        except Exception as e:
            messagebox.showerror("오류", str(e))
    
    def delete_selected_items(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showwarning("경고", "삭제할 항목을 선택하세요.")
            return
        
        for item in selected_items:
            self.tree.delete(item)
        
        self.update_total()
    
    def update_total(self):
        total = 0
        for item in self.tree.get_children():
            # 천단위 구분기호 제거 후 정수로 변환
            supply_price = self.tree.item(item)['values'][7]  # supply_price 인덱스 수정
            try:
                if isinstance(supply_price, str):
                    supply_price = int(supply_price.replace(',', ''))
                elif isinstance(supply_price, int):
                    supply_price = supply_price
                else:
                    raise ValueError("공급가액이 올바른 형식이 아닙니다")
                total += supply_price
            except (ValueError, AttributeError) as e:
                messagebox.showerror("오류", f"공급가액 변환 중 오류가 발생했습니다: {str(e)}")
                return
        self.total_label.config(text=f"총 공급가액: {total:,} 원")
    
    def load_customers(self):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT company_name FROM customers ORDER BY company_name')
        customers = [row[0] for row in c.fetchall()]
        conn.close()
        self.customer_combo['values'] = customers
    
    def load_products(self):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT name FROM products ORDER BY name')
        products = [row[0] for row in c.fetchall()]
        conn.close()
        self.product_combo['values'] = products 
    
    def save_transaction(self):
        """거래명세서 저장"""
        try:
            if not self.customer_combo.get():
                raise ValueError("거래처를 선택하세요.")
            
            if not self.tree.get_children():
                raise ValueError("최소 1개 이상의 항목을 추가하세요.")
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            
            # 수정 모드인 경우 기존 데이터 삭제
            if self.transaction_id:
                c.execute('DELETE FROM transaction_items WHERE transaction_id=?', (self.transaction_id,))
                c.execute('DELETE FROM transactions WHERE id=?', (self.transaction_id,))
            
            # 거래명세서 기본 정보 저장
            total_amount = int(self.total_label.cget("text").split(":")[1].strip().replace(",", "").replace("원", ""))
            memo = self.memo_text.get("1.0", "end-1c")
            
            if self.transaction_id:
                # 기존 ID 재사용
                c.execute('''
                    INSERT INTO transactions (id, customer_name, total_amount, memo, created_at)
                    VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
                ''', (self.transaction_id, self.customer_combo.get(), total_amount, memo))
                transaction_id = self.transaction_id
            else:
                # 새로운 거래명세서 생성
                c.execute('''
                    INSERT INTO transactions (customer_name, total_amount, memo, created_at)
                    VALUES (?, ?, ?, datetime('now', 'localtime'))
                ''', (self.customer_combo.get(), total_amount, memo))
                transaction_id = c.lastrowid
            
            # 항목 저장
            for item in self.tree.get_children():
                values = self.tree.item(item)['values']
                
                # unit_price와 supply_price 처리
                unit_price = values[6]
                supply_price = values[7]
                
                if isinstance(unit_price, str):
                    unit_price = int(unit_price.replace(",", ""))
                if isinstance(supply_price, str):
                    supply_price = int(supply_price.replace(",", ""))
                
                c.execute('''
                    INSERT INTO transaction_items 
                    (transaction_id, date, product, price_type, width, height, 
                    quantity, unit_price, supply_price) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    transaction_id,
                    values[0],
                    values[1],
                    values[2],
                    int(values[3]),
                    int(values[4]),
                    values[5],
                    unit_price,
                    supply_price
                ))
            
            conn.commit()
            messagebox.showinfo("성공", "거래명세서가 저장되었습니다.")
            self.window.destroy()
            
            # 메인 윈도우의 거래명세서 목록 갱신
            self.main_window.load_transactions()
            
        except Exception as e:
            conn.rollback()
            messagebox.showerror("오류", f"저장 중 오류가 발생했습니다: {str(e)}")
        finally:
            if conn:
                conn.close()
    
    def load_transaction_data(self):
        """기존 거래명세서 데이터 로드"""
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
                # 거래처 선택
                self.customer_combo.set(transaction[0])
                self.confirm_customer()
                
                # 메모 설정
                if transaction[2]:  # memo가 있는 경우
                    self.memo_text.delete("1.0", "end")
                    self.memo_text.insert("1.0", transaction[2])
                
                # 거래명세서 항목 조회
                c.execute('''
                    SELECT date, product, price_type, width, height, 
                           quantity, unit_price, supply_price
                    FROM transaction_items 
                    WHERE transaction_id = ?
                ''', (self.transaction_id,))
                items = c.fetchall()
                
                # 트리뷰에 항목 추가
                for item in items:
                    # unit_price와 supply_price는 이미 정수형이므로 바로 포맷팅
                    formatted_values = (
                        item[0],  # date
                        item[1],  # product
                        item[2],  # price_type
                        item[3],  # width
                        item[4],  # height
                        item[5],  # quantity
                        f"{int(item[6]):,}",  # unit_price with comma
                        f"{int(item[7]):,}"   # supply_price with comma
                    )
                    self.tree.insert('', 'end', values=formatted_values)
                
                # 총액 업데이트
                self.update_total()
                
            conn.close()
            
        except Exception as e:
            messagebox.showerror("오류", f"거래명세서 데이터 로드 중 오류 발생: {str(e)}") 
    
    def on_double_click(self, event):
        """트리뷰 항목 더블클릭 시 처리"""
        item = self.tree.selection()[0]
        column = self.tree.identify_column(event.x)
        
        # 수정 가능한 컬럼 정의 (날짜, 수량, 단가)
        editable_columns = {
            "#1": "date",      # 날짜
            "#6": "quantity",  # 수량
            "#7": "unit_price",  # 단가
        }
        
        if column in editable_columns:
            value = self.tree.item(item)['values']
            x, y, w, h = self.tree.bbox(item, column)
            
            # 현재 값을 가져옴 (천단위 구분기호 제거)
            current_value = str(value[int(column[1])-1]).replace(',', '')
            
            # 편집용 Entry 생성
            entry = ttk.Entry(self.tree, justify='center')
            entry.place(x=x, y=y, width=w, height=h)
            entry.insert(0, current_value)
            entry.select_range(0, 'end')
            entry.focus()
            
            def on_enter(e):
                """Enter 키 입력 시 처리"""
                try:
                    values = list(self.tree.item(item)['values'])
                    col_idx = int(column[1])-1
                    
                    if column == "#1":  # 날짜
                        # 날짜 형식 검증
                        try:
                            datetime.strptime(entry.get(), "%Y-%m-%d")
                            values[col_idx] = entry.get()
                        except ValueError:
                            raise ValueError("날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")
                    else:
                        # 수량이나 단가 수정
                        new_value = int(entry.get())
                        if column == "#6":  # 수량
                            unit_price = int(str(values[6]).replace(',', ''))
                            values[col_idx] = new_value
                            values[7] = f"{new_value * unit_price:,}"
                        elif column == "#7":  # 단가
                            quantity = values[5]
                            values[col_idx] = f"{new_value:,}"
                            values[7] = f"{new_value * quantity:,}"
                    
                    self.tree.item(item, values=values)
                    self.update_total()
                    entry.destroy()
                except ValueError as e:
                    messagebox.showerror("오류", str(e))
                
            def on_escape(e):
                """Escape 키 입력 시 처리"""
                entry.destroy()
            
            entry.bind('<Return>', on_enter)
            entry.bind('<Escape>', on_escape)
            entry.bind('<FocusOut>', lambda e: entry.destroy()) 