# modules/db_manager.py
import sqlite3
import os
import csv

DB_PATH = os.path.join("db", "database.db")

def load_initial_data():
    """초기 데이터 로드"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # products.csv 파일이 있으면 데이터 로드
    products_csv = os.path.join("data", "products.csv")
    if os.path.exists(products_csv):
        with open(products_csv, 'r', encoding='utf-8') as f:
            csv_reader = csv.DictReader(f)
            for row in csv_reader:
                try:
                    c.execute('''
                        INSERT OR IGNORE INTO products 
                        (name, production_price, single_side_price, double_side_price, direct_price)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        row['name'],
                        int(row['production_price']),
                        int(row['single_side_price']),
                        int(row['double_side_price']),
                        int(row['direct_price'])
                    ))
                except Exception as e:
                    print(f"Error loading product {row['name']}: {str(e)}")
    
    conn.commit()
    conn.close()

def init_db():
    """데이터베이스 초기화"""
    if not os.path.exists("db"):
        os.makedirs("db")
    
    if not os.path.exists("data"):
        os.makedirs("data")
    
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()
    
    # 테이블이 없을 때만 생성하도록 수정
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            total_amount INTEGER NOT NULL,
            memo TEXT,
            created_at DATETIME NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transaction_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            product TEXT NOT NULL,
            price_type TEXT NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price INTEGER NOT NULL,
            supply_price INTEGER NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions (id)
        )
    ''')
    
    # 거래처 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            business_id TEXT PRIMARY KEY,
            company_name TEXT NOT NULL,
            representative TEXT NOT NULL,
            address TEXT NOT NULL,
            phone TEXT NOT NULL
        )
    ''')
    
    # 상품 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            production_price INTEGER NOT NULL,
            single_side_price INTEGER NOT NULL,
            double_side_price INTEGER NOT NULL,
            direct_price INTEGER NOT NULL
        )
    ''')
    
    connection.commit()
    connection.close()
    
    # 초기 데이터 로드
    load_initial_data()

def create_tables(conn):
    c = conn.cursor()
    
    # 기존 테이블 생성 코드...
    
    # 거래명세서 테이블
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            total_amount INTEGER NOT NULL,
            memo TEXT,
            created_at DATETIME NOT NULL
        )
    ''')
    
    # 거래명세서 항목 테이블
    c.execute('''
        CREATE TABLE IF NOT EXISTS transaction_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            product TEXT NOT NULL,
            price_type TEXT NOT NULL,
            width REAL NOT NULL,
            height REAL NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price INTEGER NOT NULL,
            supply_price INTEGER NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions (id)
        )
    ''')
    
    conn.commit()
