from dataclasses import dataclass
from datetime import datetime

@dataclass
class Transaction:
    """거래명세서 모델 클래스"""
    id: int = None
    date: datetime = None
    customer_name: str = ""
    items: list = None
    total_amount: float = 0.0
    remarks: str = ""
    
    def __post_init__(self):
        if self.items is None:
            self.items = [] 