import ttkbootstrap as ttk
from ttkbootstrap.constants import *
import sqlite3
from tkinter import messagebox, filedialog
from modules.db_manager import DB_PATH
import csv

class ProductManager:
    def __init__(self, root):
        self.root = root
        
        # 새 창 생성
        self.window = ttk.Toplevel(root)
        self.window.title("상품 관리")
        self.window.geometry("800x600")
        
        # 메인 프레임 생성
        self.frame = ttk.Frame(self.window, padding="10")
        self.frame.pack(fill=BOTH, expand=True)
        
        # 상품 목록 레이블
        self.label = ttk.Label(self.frame, text="상품 목록", font=("Helvetica", 14, "bold"))
        self.label.pack(pady=(0, 10))
        
        # 상품 목록 트리뷰
        self.tree = ttk.Treeview(
            self.frame,
            columns=("name", "production_price", "single_side_price", "double_side_price", "direct_price"),
            show="headings"
        )
        
        # 컬럼 설정
        self.tree.heading("name", text="품목명")
        self.tree.heading("production_price", text="제작가")
        self.tree.heading("single_side_price", text="일면(500)")
        self.tree.heading("double_side_price", text="양면(700)")
        self.tree.heading("direct_price", text="직매")
        
        # 컬럼 너비 설정
        self.tree.column("name", width=150)
        self.tree.column("production_price", width=100)
        self.tree.column("single_side_price", width=100)
        self.tree.column("double_side_price", width=100)
        self.tree.column("direct_price", width=100)
        
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
            command=self.add_product
        )
        self.add_btn.pack(side=LEFT, padx=(0, 5))
        
        self.edit_btn = ttk.Button(
            self.button_frame,
            text="수정",
            style="warning.TButton",
            command=self.edit_product
        )
        self.edit_btn.pack(side=LEFT, padx=(0, 5))
        
        self.delete_btn = ttk.Button(
            self.button_frame,
            text="삭제",
            style="danger.TButton",
            command=self.delete_product
        )
        self.delete_btn.pack(side=LEFT, padx=(0, 5))
        
        # 데이터 가져오기/내보내기 버튼 추가
        self.import_btn = ttk.Button(
            self.button_frame,
            text="CSV 가져오기",
            style="info.TButton",
            command=self.import_csv
        )
        self.import_btn.pack(side=RIGHT, padx=(5, 0))
        
        self.export_btn = ttk.Button(
            self.button_frame,
            text="CSV 내보내기",
            style="info.TButton",
            command=self.export_csv
        )
        self.export_btn.pack(side=RIGHT, padx=(5, 0))
        
        # 초기 데이터 로드
        self.load_products()
    
    def load_products(self):
        # 기존 항목 삭제
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        # DB에서 상품 정보 로드
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT name, production_price, single_side_price, double_side_price, direct_price FROM products ORDER BY name')
        products = c.fetchall()
        
        # 트리뷰에 데이터 추가
        for product in products:
            self.tree.insert('', 'end', values=product)
            
        conn.close()
    
    def add_product(self):
        dialog = ProductDialog(self.window, "상품 추가")
        if dialog.result:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('''
                    INSERT INTO products (name, production_price, single_side_price, double_side_price, direct_price)
                    VALUES (?, ?, ?, ?, ?)
                ''', dialog.result)
                conn.commit()
                conn.close()
                self.load_products()
                messagebox.showinfo("성공", "상품이 추가되었습니다.")
            except sqlite3.IntegrityError:
                messagebox.showerror("오류", "이미 존재하는 품목명입니다.")
            except Exception as e:
                messagebox.showerror("오류", str(e))
    
    def edit_product(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("경고", "수정할 상품을 선택하세요.")
            return
            
        values = self.tree.item(selected[0])['values']
        dialog = ProductDialog(self.window, "상품 수정", values)
        
        if dialog.result:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('''
                    UPDATE products 
                    SET production_price=?, single_side_price=?, double_side_price=?, direct_price=?
                    WHERE name=?
                ''', dialog.result[1:] + (dialog.result[0],))
                conn.commit()
                conn.close()
                self.load_products()
                messagebox.showinfo("성공", "상품 정보가 수정되었습니다.")
            except Exception as e:
                messagebox.showerror("오류", str(e))
    
    def delete_product(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showwarning("경고", "삭제할 상품을 선택하세요.")
            return
            
        if messagebox.askyesno("확인", "선택한 상품들을 삭제하시겠습니까?"):
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                
                for item in selected_items:
                    name = self.tree.item(item)['values'][0]
                    c.execute('DELETE FROM products WHERE name=?', (name,))
                
                conn.commit()
                conn.close()
                self.load_products()
                messagebox.showinfo("성공", "선택한 상품들이 삭제되었습니다.")
            except Exception as e:
                messagebox.showerror("오류", str(e))
    
    def import_csv(self):
        """CSV 파일에서 상품 데이터 가져오기"""
        filename = filedialog.askopenfilename(
            title="CSV 파일 선택",
            filetypes=[("CSV 파일", "*.csv")]
        )
        
        if filename:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                
                with open(filename, 'r', encoding='utf-8') as f:
                    csv_reader = csv.DictReader(f)
                    for row in csv_reader:
                        c.execute('''
                            INSERT OR REPLACE INTO products 
                            (name, production_price, single_side_price, double_side_price, direct_price)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (
                            row['name'],
                            int(row['production_price']),
                            int(row['single_side_price']),
                            int(row['double_side_price']),
                            int(row['direct_price'])
                        ))
                
                conn.commit()
                conn.close()
                self.load_products()
                messagebox.showinfo("성공", "CSV 파일을 성공적으로 가져왔습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"CSV 파일 가져오기 실패: {str(e)}")
    
    def export_csv(self):
        """상품 데이터를 CSV 파일로 내보내기"""
        filename = filedialog.asksaveasfilename(
            title="CSV 파일 저장",
            defaultextension=".csv",
            filetypes=[("CSV 파일", "*.csv")]
        )
        
        if filename:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('SELECT name, production_price, single_side_price, double_side_price, direct_price FROM products ORDER BY name')
                products = c.fetchall()
                conn.close()
                
                with open(filename, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow(['name', 'production_price', 'single_side_price', 'double_side_price', 'direct_price'])
                    writer.writerows(products)
                
                messagebox.showinfo("성공", "CSV 파일로 내보내기를 완료했습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"CSV 파일 내보내기 실패: {str(e)}")

class ProductDialog:
    def __init__(self, parent, title, initial_values=None):
        self.dialog = ttk.Toplevel(parent)
        self.dialog.title(title)
        self.dialog.geometry("400x300")
        self.result = None
        
        # 입력 필드 생성
        fields = [
            ("품목명:", "name"),
            ("제작가:", "production_price"),
            ("일면(500):", "single_side_price"),
            ("양면(700):", "double_side_price"),
            ("직매:", "direct_price")
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
        try:
            values = []
            # 품목명 검증
            name = self.entries["name"].get().strip()
            if not name:
                raise ValueError("품목명을 입력하세요.")
            values.append(name)
            
            # 가격 정보 검증
            for field in ["production_price", "single_side_price", "double_side_price", "direct_price"]:
                value = self.entries[field].get().strip()
                if not value:
                    raise ValueError(f"{field}를 입력하세요.")
                try:
                    values.append(int(value))
                except ValueError:
                    raise ValueError(f"{field}는 숫자만 입력 가능합니다.")
            
            self.result = tuple(values)
            self.dialog.destroy()
            
        except ValueError as e:
            messagebox.showwarning("경고", str(e))
    
    def cancel(self):
        self.dialog.destroy() 