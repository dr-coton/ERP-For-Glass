from __future__ import annotations

import csv
import io
import sqlite3
from typing import Any

from flask import Blueprint, Response, flash, redirect, render_template, request, url_for
from werkzeug.exceptions import NotFound

from .db import fetch_all, fetch_one, get_db

bp = Blueprint("products", __name__, url_prefix="/products")

PRICE_FIELDS = [
    ("production_price", "제작가"),
    ("single_side_price", "일면(500)"),
    ("double_side_price", "양면(700)"),
    ("direct_price", "직매"),
]


def _row_to_product(row: Any) -> dict[str, Any]:
    return {
        "name": row["name"],
        "production_price": row["production_price"],
        "single_side_price": row["single_side_price"],
        "double_side_price": row["double_side_price"],
        "direct_price": row["direct_price"],
    }


def _get_product_or_404(name: str) -> dict[str, Any]:
    product = fetch_one(
        "SELECT name, production_price, single_side_price, double_side_price, direct_price FROM products WHERE name = ?",
        (name,),
    )
    if product is None:
        raise NotFound("상품 정보를 찾을 수 없습니다.")
    return _row_to_product(product)


@bp.route("/")
def index():
    rows = fetch_all(
        "SELECT name, production_price, single_side_price, double_side_price, direct_price FROM products ORDER BY name"
    )
    products = [_row_to_product(row) for row in rows]
    return render_template("products/index.html", products=products)


@bp.route("/new", methods=["GET", "POST"])
def create():
    form_state = _extract_product_form_state(request.form)

    if request.method == "POST":
        try:
            product = _validate_and_parse_product(form_state)
        except ValueError as exc:
            flash(str(exc), "danger")
            return render_template("products/form.html", mode="create", form_state=form_state), 400

        try:
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO products (name, production_price, single_side_price, double_side_price, direct_price)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        product["name"],
                        product["production_price"],
                        product["single_side_price"],
                        product["double_side_price"],
                        product["direct_price"],
                    ),
                )
                conn.commit()
        except sqlite3.IntegrityError:
            flash("이미 등록된 품목명입니다.", "danger")
            return render_template("products/form.html", mode="create", form_state=form_state), 400

        flash("상품이 추가되었습니다.", "success")
        return redirect(url_for("products.index"))

    return render_template("products/form.html", mode="create", form_state=form_state)


@bp.route("/<path:name>/edit", methods=["GET", "POST"])
def edit(name: str):
    product = _get_product_or_404(name)
    form_state = _extract_product_form_state(request.form, defaults=product)

    if request.method == "POST":
        try:
            updated = _validate_and_parse_product(form_state)
        except ValueError as exc:
            flash(str(exc), "danger")
            return render_template("products/form.html", mode="edit", form_state=form_state), 400

        try:
            with get_db() as conn:
                cursor = conn.execute(
                    """
                    UPDATE products
                    SET name = ?, production_price = ?, single_side_price = ?, double_side_price = ?, direct_price = ?
                    WHERE name = ?
                    """,
                    (
                        updated["name"],
                        updated["production_price"],
                        updated["single_side_price"],
                        updated["double_side_price"],
                        updated["direct_price"],
                        product["name"],
                    ),
                )
                conn.commit()
        except sqlite3.IntegrityError:
            flash("이미 사용 중인 품목명입니다.", "danger")
            return render_template("products/form.html", mode="edit", form_state=form_state), 400

        if cursor.rowcount == 0:
            raise NotFound("상품 정보를 찾을 수 없습니다.")

        flash("상품 정보가 수정되었습니다.", "success")
        return redirect(url_for("products.index"))

    return render_template("products/form.html", mode="edit", form_state=form_state)


@bp.route("/<path:name>/delete", methods=["POST"])
def delete(name: str):
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM products WHERE name = ?", (name,))
        conn.commit()
        if cursor.rowcount == 0:
            raise NotFound("삭제할 상품을 찾을 수 없습니다.")

    flash("상품이 삭제되었습니다.", "success")
    return redirect(url_for("products.index"))


@bp.route("/import", methods=["POST"])
def import_csv():
    file = request.files.get("file")
    if file is None or not file.filename:
        flash("CSV 파일을 선택하세요.", "danger")
        return redirect(url_for("products.index"))

    raw_bytes = file.read()
    if not raw_bytes:
        flash("빈 파일입니다.", "danger")
        return redirect(url_for("products.index"))

    for encoding in ("utf-8-sig", "cp949"):
        try:
            text_stream = io.StringIO(raw_bytes.decode(encoding))
            break
        except UnicodeDecodeError:
            text_stream = None
    if text_stream is None:
        flash("CSV 파일 인코딩을 확인하세요. (UTF-8 또는 CP949 지원)", "danger")
        return redirect(url_for("products.index"))

    reader = csv.DictReader(text_stream)
    required_columns = {"name", "production_price", "single_side_price", "double_side_price", "direct_price"}
    if not required_columns.issubset(reader.fieldnames or set()):
        flash("CSV 파일 형식이 올바르지 않습니다.", "danger")
        return redirect(url_for("products.index"))

    records: list[tuple[Any, ...]] = []
    try:
        for row in reader:
            name = (row.get("name") or "").strip()
            if not name:
                raise ValueError("품목명이 비어 있습니다.")
            values = [name]
            for field, label in PRICE_FIELDS:
                raw = (row.get(field) or "").strip()
                if not raw:
                    raise ValueError(f"{label} 값이 비어 있습니다.")
                values.append(int(raw))
            records.append(tuple(values))
    except (ValueError, TypeError) as exc:
        flash(f"CSV 데이터를 처리하는 중 오류가 발생했습니다: {exc}", "danger")
        return redirect(url_for("products.index"))

    if not records:
        flash("추가할 데이터가 없습니다.", "warning")
        return redirect(url_for("products.index"))

    with get_db() as conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO products 
            (name, production_price, single_side_price, double_side_price, direct_price)
            VALUES (?, ?, ?, ?, ?)
            """,
            records,
        )
        conn.commit()

    flash("CSV 데이터를 불러왔습니다.", "success")
    return redirect(url_for("products.index"))


@bp.route("/export")
def export_csv():
    products = fetch_all(
        "SELECT name, production_price, single_side_price, double_side_price, direct_price FROM products ORDER BY name"
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "production_price", "single_side_price", "double_side_price", "direct_price"])
    for product in products:
        writer.writerow([
            product["name"],
            product["production_price"],
            product["single_side_price"],
            product["double_side_price"],
            product["direct_price"],
        ])

    response = Response(
        output.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=products.csv"},
    )
    return response


def _extract_product_form_state(form, *, defaults: dict[str, Any] | None = None) -> dict[str, str]:
    defaults = defaults or {}
    name_value = form.get('name') if form else None
    state = {
        'name': (name_value.strip() if name_value is not None else str(defaults.get('name', ''))),
    }
    for field, _ in PRICE_FIELDS:
        raw_value = form.get(field) if form else None
        if raw_value is not None and raw_value != '':
            state[field] = raw_value.strip()
        else:
            default_value = defaults.get(field, '')
            state[field] = str(default_value) if default_value is not None else ''
    return state


def _validate_and_parse_product(form_state: dict[str, str]) -> dict[str, Any]:
    name = form_state.get("name", "").strip()
    if not name:
        raise ValueError("품목명을 입력하세요.")

    parsed: dict[str, Any] = {"name": name}
    for field, label in PRICE_FIELDS:
        raw_value = form_state.get(field, "").strip()
        if not raw_value:
            raise ValueError(f"{label}를 입력하세요.")
        try:
            parsed[field] = int(raw_value)
        except ValueError:
            raise ValueError(f"{label}는 숫자만 입력 가능합니다.")
    return parsed
