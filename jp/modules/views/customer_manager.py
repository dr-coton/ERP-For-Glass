import ttkbootstrap as ttk
from ttkbootstrap.constants import *
import sqlite3
from tkinter import messagebox
from modules.db_manager import DB_PATH

class CustomerManager:
    def __init__(self, root):
        self.root = root
        
        # 새 창 생성
        self.window = ttk.Toplevel(root)
        self.window.title("거래처 관리")
        self.window.geometry("800x600")
        
        # 메인 프레임 생성
        self.frame = ttk.Frame(self.window, padding="10")
        self.frame.pack(fill=BOTH, expand=True)
        
        # 거래처 목록 레이블
        self.label = ttk.Label(self.frame, text="거래처 목록", font=("Helvetica", 14, "bold"))
        self.label.pack(pady=(0, 10))
        
        # 거래처 목록 트리뷰
        self.tree = ttk.Treeview(self.frame, columns=("business_id", "company_name", "representative", "address", "phone"), show="headings")
        
        # 컬럼 설정
        self.tree.heading("business_id", text="사업자등록번호")
        self.tree.heading("company_name", text="상호명")
        self.tree.heading("representative", text="대표자")
        self.tree.heading("address", text="주소")
        self.tree.heading("phone", text="전화번호")
        
        # 컬럼 너비 설정
        self.tree.column("business_id", width=120)
        self.tree.column("company_name", width=150)
        self.tree.column("representative", width=100)
        self.tree.column("address", width=250)
        self.tree.column("phone", width=120)
        
        self.tree.pack(fill=BOTH, expand=True, pady=(0, 10))
        
        # 스크롤바 추가
        scrollbar = ttk.Scrollbar(self.frame, orient=VERTICAL, command=self.tree.yview)
        scrollbar.pack(side=RIGHT, fill=Y)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # 버튼 프레임
        self.button_frame = ttk.Frame(self.frame)
        self.button_frame.pack(fill=X)
        
        # 버튼들
        self.add_btn = ttk.Button(
            self.button_frame,
            text="추가",
            style="success.TButton",
            command=self.add_customer
        )
        self.add_btn.pack(side=LEFT, padx=(0, 5))
        
        self.edit_btn = ttk.Button(
            self.button_frame,
            text="수정",
            style="warning.TButton",
            command=self.edit_customer
        )
        self.edit_btn.pack(side=LEFT, padx=(0, 5))
        
        self.delete_btn = ttk.Button(
            self.button_frame,
            text="삭제",
            style="danger.TButton",
            command=self.delete_customer
        )
        self.delete_btn.pack(side=LEFT, padx=(0, 5))
        
        # 초기 데이터 로드
        self.load_customers()
    
    def load_customers(self):
        # 기존 항목 삭제
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        # DB에서 거래처 정보 로드
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT * FROM customers ORDER BY company_name')
        customers = c.fetchall()
        
        # 트리뷰에 데이터 추가
        for customer in customers:
            self.tree.insert('', 'end', values=customer)
            
        conn.close()
    
    def add_customer(self):
        # 거래처 추가 다이얼로그 생성
        dialog = CustomerDialog(self.window, "거래처 추가")
        if dialog.result:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('''
                    INSERT INTO customers (business_id, company_name, representative, address, phone)
                    VALUES (?, ?, ?, ?, ?)
                ''', dialog.result)
                conn.commit()
                conn.close()
                self.load_customers()
                messagebox.showinfo("성공", "거래처가 추가되었습니다.")
            except sqlite3.IntegrityError:
                messagebox.showerror("오류", "이미 존재하는 사업자등록번호입니다.")
            except Exception as e:
                messagebox.showerror("오류", str(e))
    
    def edit_customer(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("경고", "수정할 거래처를 선택하세요.")
            return
            
        # 선택된 거래처 정보 가져오기
        values = self.tree.item(selected[0])['values']
        dialog = CustomerDialog(self.window, "거래처 수정", values)
        
        if dialog.result:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('''
                    UPDATE customers 
                    SET company_name=?, representative=?, address=?, phone=?
                    WHERE business_id=?
                ''', dialog.result[1:] + (dialog.result[0],))
                conn.commit()
                conn.close()
                self.load_customers()
                messagebox.showinfo("성공", "거래처 정보가 수정되었습니다.")
            except Exception as e:
                messagebox.showerror("오류", str(e))
    
    def delete_customer(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("경고", "삭제할 거래처를 선택하세요.")
            return
            
        if messagebox.askyesno("확인", "선택한 거래처를 삭제하시겠습니까?"):
            try:
                business_id = self.tree.item(selected[0])['values'][0]
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('DELETE FROM customers WHERE business_id=?', (business_id,))
                conn.commit()
                conn.close()
                self.load_customers()
                messagebox.showinfo("성공", "거래처가 삭제되었습니다.")
            except Exception as e:
                messagebox.showerror("오류", str(e))

class CustomerDialog:
    def __init__(self, parent, title, initial_values=None):
        self.dialog = ttk.Toplevel(parent)
        self.dialog.title(title)
        self.dialog.geometry("400x300")
        self.result = None
        
        # 입력 필드 생성
        fields = [
            ("사업자등록번호:", "business_id"),
            ("상호명:", "company_name"),
            ("대표자:", "representative"),
            ("주소:", "address"),
            ("전화번호:", "phone")
        ]
        
        self.entries = {}
        
        for i, (label_text, field_name) in enumerate(fields):
            frame = ttk.Frame(self.dialog)
            frame.pack(fill=X, padx=20, pady=5)
            
            label = ttk.Label(frame, text=label_text, width=15)
            label.pack(side=LEFT)
            
            entry = ttk.Entry(frame)
            entry.pack(side=LEFT, fill=X, expand=True)
            self.entries[field_name] = entry
            
            # 초기값 설정
            if initial_values:
                entry.insert(0, initial_values[i])
        
        # 버튼 프레임
        button_frame = ttk.Frame(self.dialog)
        button_frame.pack(fill=X, padx=20, pady=20)
        
        ttk.Button(button_frame, text="확인", command=self.ok).pack(side=LEFT, padx=5)
        ttk.Button(button_frame, text="취소", command=self.cancel).pack(side=LEFT)
        
        # 모달 동작
        self.dialog.transient(parent)
        self.dialog.grab_set()
        parent.wait_window(self.dialog)
    
    def ok(self):
        # 입력값 검증
        values = []
        for field in ["business_id", "company_name", "representative", "address", "phone"]:
            value = self.entries[field].get().strip()
            if not value:
                messagebox.showwarning("경고", f"{field}을(를) 입력하세요.")
                return
            values.append(value)
        
        self.result = tuple(values)
        self.dialog.destroy()
    
    def cancel(self):
        self.dialog.destroy() 