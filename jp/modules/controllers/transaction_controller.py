from ..models.transaction import Transaction
import sqlite3
from ..db_manager import DB_PATH

class TransactionController:
    """거래명세서 컨트롤러"""
    
    @staticmethod
    def create_transaction(transaction: Transaction) -> bool:
        """새로운 거래명세서 생성"""
        try:
            # DB 연동 로직 구현 예정
            return True
        except Exception as e:
            print(f"Error creating transaction: {e}")
            return False
    
    @staticmethod
    def get_all_transactions() -> list[Transaction]:
        """모든 거래명세서 조회"""
        transactions = []
        # DB 조회 로직 구현 예정
        return transactions 