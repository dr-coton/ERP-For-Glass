# 거래명세서 관리 시스템

이 프로젝트는 거래처, 상품, 거래명세서를 관리하고 엑셀 문서로 내보낼 수 있는 도구입니다. 기존 Tkinter 기반 데스크톱 애플리케이션과 함께 Flask 기반 웹 인터페이스를 제공합니다.

## 사전 준비

1. Python 3.11+ 환경을 사용합니다.
2. 가상 환경을 사용하는 것을 권장합니다.
3. 필요한 패키지를 설치합니다.

```bash
python -m venv venv
source venv/bin/activate  # Windows에서는 venv\Scripts\activate
pip install -r requirements.txt
```

## 웹 애플리케이션 실행

```bash
python web_app.py
```

- 기본적으로 `http://localhost:5000` 에서 웹 인터페이스를 사용할 수 있습니다.
- 애플리케이션이 시작될 때 `modules/db_manager.init_db()`가 실행되어 데이터베이스가 자동으로 준비됩니다.

### 주요 기능

- **거래명세서 관리**: 목록 조회, 검색, 월별 필터, 상세 보기, 수정/삭제, 엑셀 다운로드, 월별 통합 다운로드
- **거래처 관리**: 거래처 목록, 추가, 수정, 삭제
- **상품 관리**: 상품 목록, 추가/수정/삭제, CSV 내보내기 및 가져오기

## 데스크톱 애플리케이션 실행 (선택 사항)

기존 Tkinter 애플리케이션을 사용하려면 다음 명령을 실행합니다.

```bash
python main.py
```

## 엑셀 템플릿

`templates/transaction_template.xlsx` 파일이 단일 거래명세서 다운로드에 사용됩니다. 파일이 누락된 경우 웹 인터페이스에서 다운로드 기능을 사용할 수 없습니다.

## 개발 참고

- 데이터베이스 파일은 `db/database.db` 경로에 생성됩니다.
- 초기 상품 데이터를 가져오려면 `data/products.csv` 파일을 준비한 뒤 웹 UI 또는 CSV 가져오기 기능을 활용하세요.
- 새 기능을 추가할 때에는 `webapp` 패키지 내 블루프린트를 확장하면 됩니다.
