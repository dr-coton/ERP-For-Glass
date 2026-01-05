from __future__ import annotations

import math
from datetime import datetime
from typing import Any

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)
from werkzeug.exceptions import NotFound

from .db import get_db, fetch_all, fetch_one
from .excel import (
    TransactionNotFoundError,
    build_monthly_workbook,
    build_transaction_workbook,
)

bp = Blueprint("transactions", __name__)

PRICE_TYPES = ["제작가", "일면(500)", "양면(700)", "직매"]

def _available_months() -> list[str]:
    rows = fetch_all(
        """
        SELECT DISTINCT strftime('%Y-%m', 
            COALESCE(
                (SELECT date FROM transaction_items 
                 WHERE transaction_id = t.id 
                 ORDER BY date ASC LIMIT 1),
                t.created_at
            )
        ) AS month
        FROM transactions t
        ORDER BY month DESC
        """
    )
    return [row["month"] for row in rows if row["month"]]


def _fetch_product_pricing() -> dict[str, dict[str, int]]:
    rows = fetch_all(
        """
        SELECT name, production_price, single_side_price, double_side_price, direct_price
        FROM products
        ORDER BY name
        """
    )
    pricing: dict[str, dict[str, int]] = {}
    for row in rows:
        pricing[row["name"]] = {
            "제작가": row["production_price"],
            "일면(500)": row["single_side_price"],
            "양면(700)": row["double_side_price"],
            "직매": row["direct_price"],
        }
    return pricing


def _fetch_customers() -> list[str]:
    rows = fetch_all(
        "SELECT company_name FROM customers ORDER BY company_name"
    )
    return [row["company_name"] for row in rows]


def _fetch_transaction(transaction_id: int) -> dict[str, Any]:
    transaction = fetch_one(
        """
        SELECT 
            t.id,
            t.customer_name,
            t.total_amount,
            t.memo,
            t.created_at,
            c.business_id,
            c.representative,
            c.address,
            c.phone
        FROM transactions t
        LEFT JOIN customers c ON t.customer_name = c.company_name
        WHERE t.id = ?
        """,
        (transaction_id,),
    )
    if transaction is None:
        raise NotFound("해당 거래명세서가 존재하지 않습니다.")

    items = fetch_all(
        """
        SELECT date, product, price_type, width, height, quantity, unit_price, supply_price
        FROM transaction_items
        WHERE transaction_id = ?
        ORDER BY date
        """,
        (transaction_id,),
    )

    return {
        "id": transaction["id"],
        "customer_name": transaction["customer_name"],
        "total_amount": transaction["total_amount"],
        "memo": transaction["memo"] or "",
        "created_at": transaction["created_at"],
        "customer": {
            "business_id": transaction["business_id"],
            "representative": transaction["representative"],
            "address": transaction["address"],
            "phone": transaction["phone"],
        },
        "items": [
            {
                "date": row["date"],
                "product": row["product"],
                "price_type": row["price_type"],
                "width": row["width"],
                "height": row["height"],
                "quantity": row["quantity"],
                "unit_price": row["unit_price"],
                "supply_price": row["supply_price"],
            }
            for row in items
        ],
    }


def _extract_form_state(data) -> dict[str, Any]:
    dates = data.getlist("item_date[]")
    products = data.getlist("item_product[]")
    price_types = data.getlist("item_price_type[]")
    widths = data.getlist("item_width[]")
    heights = data.getlist("item_height[]")
    quantities = data.getlist("item_quantity[]")

    items = []
    for idx in range(min(len(dates), len(products), len(price_types), len(widths), len(heights), len(quantities))):
        items.append(
            {
                "date": dates[idx],
                "product": products[idx],
                "price_type": price_types[idx],
                "width": widths[idx],
                "height": heights[idx],
                "quantity": quantities[idx],
            }
        )

    return {
        "customer_name": data.get("customer_name", ""),
        "memo": data.get("memo", ""),
        "items": items,
    }


def _persist_transaction(form_data, *, transaction_id: int | None = None) -> int:
    customer_name = (form_data.get("customer_name") or "").strip()
    if not customer_name:
        raise ValueError("거래처를 선택하세요.")

    memo = (form_data.get("memo") or "").strip()

    dates = form_data.getlist("item_date[]")
    products = form_data.getlist("item_product[]")
    price_types = form_data.getlist("item_price_type[]")
    widths = form_data.getlist("item_width[]")
    heights = form_data.getlist("item_height[]")
    quantities = form_data.getlist("item_quantity[]")

    if not dates:
        raise ValueError("최소 1개 이상의 항목을 추가하세요.")

    item_count = min(len(dates), len(products), len(price_types), len(widths), len(heights), len(quantities))
    if item_count == 0:
        raise ValueError("항목 정보가 올바르게 입력되지 않았습니다.")

    product_pricing = _fetch_product_pricing()
    if not product_pricing:
        raise ValueError("등록된 상품이 없습니다. 먼저 상품을 추가하세요.")

    items_to_save = []
    total_amount = 0

    for index in range(item_count):
        date_value = dates[index].strip()
        if not date_value:
            raise ValueError(f"{index + 1}번째 항목의 날짜를 입력하세요.")
        try:
            datetime.strptime(date_value, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"{index + 1}번째 항목의 날짜 형식이 올바르지 않습니다 (YYYY-MM-DD).")

        product_value = products[index].strip()
        if not product_value:
            raise ValueError(f"{index + 1}번째 항목의 품목을 선택하세요.")
        if product_value not in product_pricing:
            raise ValueError(f"{product_value} 상품 정보를 찾을 수 없습니다.")

        price_type_value = price_types[index].strip()
        if price_type_value not in PRICE_TYPES:
            raise ValueError(f"{index + 1}번째 항목의 단가 종류가 올바르지 않습니다.")

        try:
            width_value = int(float(widths[index]))
            height_value = int(float(heights[index]))
            quantity_value = int(quantities[index])
        except (TypeError, ValueError):
            raise ValueError(f"{index + 1}번째 항목의 규격 또는 수량이 올바른 숫자가 아닙니다.")

        if width_value <= 0 or height_value <= 0 or quantity_value <= 0:
            raise ValueError(f"{index + 1}번째 항목의 규격과 수량은 1 이상의 값이어야 합니다.")

        base_price = product_pricing[product_value][price_type_value]
        unit_price = math.floor(base_price * width_value * height_value / 90000)
        supply_price = unit_price * quantity_value

        items_to_save.append(
            (
                date_value,
                product_value,
                price_type_value,
                width_value,
                height_value,
                quantity_value,
                unit_price,
                supply_price,
            )
        )
        total_amount += supply_price

    with get_db() as conn:
        cursor = conn.cursor()
        try:
            if transaction_id is None:
                cursor.execute(
                    """
                    INSERT INTO transactions (customer_name, total_amount, memo, created_at)
                    VALUES (?, ?, ?, datetime('now', 'localtime'))
                    """,
                    (customer_name, total_amount, memo),
                )
                new_id = cursor.lastrowid
            else:
                cursor.execute(
                    """
                    UPDATE transactions
                    SET customer_name = ?, total_amount = ?, memo = ?, created_at = datetime('now', 'localtime')
                    WHERE id = ?
                    """,
                    (customer_name, total_amount, memo, transaction_id),
                )
                new_id = transaction_id
                cursor.execute(
                    "DELETE FROM transaction_items WHERE transaction_id = ?",
                    (transaction_id,),
                )

            cursor.executemany(
                """
                INSERT INTO transaction_items 
                (transaction_id, date, product, price_type, width, height, quantity, unit_price, supply_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [(new_id, *item) for item in items_to_save],
            )
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    return new_id


@bp.route("/")
def index():
    query = (request.args.get("q") or "").strip()
    month_filter = (request.args.get("month") or "").strip()

    base_sql = """
        SELECT 
            t.id,
            COALESCE(
                (SELECT date FROM transaction_items WHERE transaction_id = t.id ORDER BY date ASC LIMIT 1),
                strftime('%Y-%m-%d', t.created_at)
            ) AS display_date,
            t.customer_name,
            t.total_amount,
            t.memo,
            (SELECT COUNT(*) FROM transaction_items WHERE transaction_id = t.id) AS item_count
        FROM transactions t
    """

    clauses = []
    params: list[Any] = []

    if query:
        clauses.append("(t.customer_name LIKE ? OR t.memo LIKE ?)")
        params.extend([f"%{query}%", f"%{query}%"])

    if month_filter:
        clauses.append(
            "strftime('%Y-%m', COALESCE((SELECT date FROM transaction_items WHERE transaction_id = t.id ORDER BY date ASC LIMIT 1), t.created_at)) = ?"
        )
        params.append(month_filter)

    if clauses:
        base_sql += " WHERE " + " AND ".join(clauses)

    base_sql += " ORDER BY display_date DESC"

    rows = fetch_all(base_sql, params)
    transactions = [
        {
            "id": row["id"],
            "display_date": row["display_date"],
            "customer_name": row["customer_name"],
            "total_amount": row["total_amount"],
            "memo": row["memo"],
            "item_count": row["item_count"],
        }
        for row in rows
    ]

    return render_template(
        "transactions/list.html",
        transactions=transactions,
        query=query,
        month_filter=month_filter,
        months=_available_months(),
    )


@bp.route("/transactions/new", methods=["GET", "POST"])
def create_transaction():
    if request.method == "POST":
        try:
            transaction_id = _persist_transaction(request.form)
        except ValueError as exc:
            flash(str(exc), "danger")
            form_state = _extract_form_state(request.form)
            return (
                render_template(
                    "transactions/form.html",
                    mode="create",
                    form_state=form_state,
                    price_types=PRICE_TYPES,
                    product_pricing=_fetch_product_pricing(),
                    customers=_fetch_customers(),
                ),
                400,
            )

        flash("거래명세서가 저장되었습니다.", "success")
        return redirect(url_for("transactions.view_transaction", transaction_id=transaction_id))

    form_state = {"customer_name": "", "memo": "", "items": []}
    return render_template(
        "transactions/form.html",
        mode="create",
        form_state=form_state,
        price_types=PRICE_TYPES,
        product_pricing=_fetch_product_pricing(),
        customers=_fetch_customers(),
    )


@bp.route("/transactions/<int:transaction_id>/edit", methods=["GET", "POST"])
def edit_transaction(transaction_id: int):
    transaction = _fetch_transaction(transaction_id)

    if request.method == "POST":
        try:
            _persist_transaction(request.form, transaction_id=transaction_id)
        except ValueError as exc:
            flash(str(exc), "danger")
            form_state = _extract_form_state(request.form)
            return (
                render_template(
                    "transactions/form.html",
                    mode="edit",
                    form_state=form_state,
                    price_types=PRICE_TYPES,
                    product_pricing=_fetch_product_pricing(),
                    customers=_fetch_customers(),
                    transaction=transaction,
                ),
                400,
            )

        flash("거래명세서가 수정되었습니다.", "success")
        return redirect(url_for("transactions.view_transaction", transaction_id=transaction_id))

    form_state = {
        "customer_name": transaction["customer_name"],
        "memo": transaction["memo"],
        "items": [
            {
                "date": item["date"],
                "product": item["product"],
                "price_type": item["price_type"],
                "width": item["width"],
                "height": item["height"],
                "quantity": item["quantity"],
            }
            for item in transaction["items"]
        ],
    }

    return render_template(
        "transactions/form.html",
        mode="edit",
        form_state=form_state,
        price_types=PRICE_TYPES,
        product_pricing=_fetch_product_pricing(),
        customers=_fetch_customers(),
        transaction=transaction,
    )


@bp.route("/transactions/<int:transaction_id>")
def view_transaction(transaction_id: int):
    transaction = _fetch_transaction(transaction_id)
    return render_template("transactions/detail.html", transaction=transaction)


@bp.route("/transactions/<int:transaction_id>/delete", methods=["POST"])
def delete_transaction(transaction_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM transaction_items WHERE transaction_id = ?",
            (transaction_id,),
        )
        cursor.execute(
            "DELETE FROM transactions WHERE id = ?",
            (transaction_id,),
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise NotFound("삭제할 거래명세서를 찾을 수 없습니다.")

    flash("거래명세서가 삭제되었습니다.", "success")
    return redirect(url_for("transactions.index"))


@bp.route("/transactions/<int:transaction_id>/download")
def download_transaction(transaction_id: int):
    try:
        output, filename = build_transaction_workbook(transaction_id)
    except TransactionNotFoundError as exc:
        raise NotFound(str(exc)) from exc
    except FileNotFoundError as exc:
        flash(str(exc), "danger")
        return redirect(url_for("transactions.view_transaction", transaction_id=transaction_id))

    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@bp.route("/transactions/monthly-download")
def download_monthly():
    month = (request.args.get("month") or "").strip()
    if not month:
        flash("다운로드할 월을 선택하세요.", "warning")
        return redirect(url_for("transactions.index"))

    try:
        output, filename = build_monthly_workbook(month)
    except TransactionNotFoundError as exc:
        flash(str(exc), "warning")
        return redirect(url_for("transactions.index"))
    except FileNotFoundError as exc:
        flash(str(exc), "danger")
        return redirect(url_for("transactions.index"))

    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
