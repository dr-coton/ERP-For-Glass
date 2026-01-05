import sqlite3
from datetime import datetime, date
from modules.db_manager import DB_PATH
from modules.excel_manager import ExcelManager
import os

def generate_joeun_statement():
    """이성창호의 2025년 9월 1일 이후 거래명세서를 왕성글래스 형식으로 생성"""
    
    customer_name = "나이스창호"
    start_date = "2025-12-01"
    end_date = date.today().strftime('%Y-%m-%d')
    
    # 데이터베이스 연결
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 조은유리의 거래 데이터 조회
    c.execute('''
        SELECT t.id, t.customer_name
        FROM transactions t
        WHERE t.customer_name LIKE ? 
        AND DATE(
            COALESCE(
                (SELECT date FROM transaction_items 
                 WHERE transaction_id = t.id 
                 ORDER BY date ASC LIMIT 1),
                t.created_at
            )
        ) >= ?
        ORDER BY t.created_at
    ''', (customer_name, start_date))
    
    transactions = c.fetchall()
    
    if not transactions:
        print(f"{customer_name}의 2025년 10월 1일 이후 거래내역이 없습니다.")
        conn.close()
        return None
    
    print(f"찾은 거래 건수: {len(transactions)}")
    
    # ExcelManager를 사용하여 월간 형식으로 생성
    # create_monthly_report 메서드를 사용하되, 기간 표시를 수정
    wb = ExcelManager.create_monthly_report("12월1일-현재", transactions)
    
    # 파일명 설정
    filename = f"{customer_name}_거래명세서_20251201_현재.xlsx"
    filepath = os.path.join("exports", filename)
    
    # exports 디렉토리가 없으면 생성
    if not os.path.exists("exports"):
        os.makedirs("exports")
    
    # 엑셀 파일 저장
    wb.save(filepath)
    
    conn.close()
    
    print(f"\n✅ 거래명세서가 생성되었습니다!")
    print(f"📁 파일 위치: {filepath}")
    print(f"📊 총 {len(transactions)}건의 거래내역이 포함되었습니다.")
    
    return filepath

if __name__ == "__main__":
    generate_joeun_statement()