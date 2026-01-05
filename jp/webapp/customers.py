from __future__ import annotations

import sqlite3
from typing import Any

from flask import Blueprint, flash, redirect, render_template, request, url_for
from werkzeug.exceptions import NotFound

from .db import fetch_all, fetch_one, get_db

bp = Blueprint("customers", __name__, url_prefix="/customers")


def _row_to_customer(row: Any) -> dict[str, Any]:
    return {
        "business_id": row["business_id"],
        "company_name": row["company_name"],
        "representative": row["representative"],
        "address": row["address"],
        "phone": row["phone"],
    }


def _get_customer_or_404(business_id: str) -> dict[str, Any]:
    customer = fetch_one(
        "SELECT business_id, company_name, representative, address, phone FROM customers WHERE business_id = ?",
        (business_id,),
    )
    if customer is None:
        raise NotFound("거래처 정보를 찾을 수 없습니다.")
    return _row_to_customer(customer)


@bp.route("/")
def index():
    rows = fetch_all(
        "SELECT business_id, company_name, representative, address, phone FROM customers ORDER BY company_name"
    )
    customers = [_row_to_customer(row) for row in rows]
    return render_template("customers/index.html", customers=customers)


@bp.route("/new", methods=["GET", "POST"])
def create():
    form_state = {
        "business_id": request.form.get("business_id", "").strip(),
        "company_name": request.form.get("company_name", "").strip(),
        "representative": request.form.get("representative", "").strip(),
        "address": request.form.get("address", "").strip(),
        "phone": request.form.get("phone", "").strip(),
    }

    if request.method == "POST":
        try:
            _validate_customer_form(form_state)
        except ValueError as exc:
            flash(str(exc), "danger")
            return render_template("customers/form.html", mode="create", form_state=form_state), 400

        try:
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO customers (business_id, company_name, representative, address, phone)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        form_state["business_id"],
                        form_state["company_name"],
                        form_state["representative"],
                        form_state["address"],
                        form_state["phone"],
                    ),
                )
                conn.commit()
        except sqlite3.IntegrityError:
            flash("이미 등록된 사업자등록번호입니다.", "danger")
            return render_template("customers/form.html", mode="create", form_state=form_state), 400

        flash("거래처가 추가되었습니다.", "success")
        return redirect(url_for("customers.index"))

    return render_template("customers/form.html", mode="create", form_state=form_state)


@bp.route("/<business_id>/edit", methods=["GET", "POST"])
def edit(business_id: str):
    customer = _get_customer_or_404(business_id)

    form_state = {
        "business_id": customer["business_id"],
        "company_name": request.form.get("company_name", customer["company_name"]).strip(),
        "representative": request.form.get("representative", customer["representative"]).strip(),
        "address": request.form.get("address", customer["address"]).strip(),
        "phone": request.form.get("phone", customer["phone"]).strip(),
    }

    if request.method == "POST":
        try:
            _validate_customer_form(form_state, allow_business_id_edit=False)
        except ValueError as exc:
            flash(str(exc), "danger")
            return render_template("customers/form.html", mode="edit", form_state=form_state), 400

        with get_db() as conn:
            cursor = conn.execute(
                """
                UPDATE customers
                SET company_name = ?, representative = ?, address = ?, phone = ?
                WHERE business_id = ?
                """,
                (
                    form_state["company_name"],
                    form_state["representative"],
                    form_state["address"],
                    form_state["phone"],
                    customer["business_id"],
                ),
            )
            conn.commit()
            if cursor.rowcount == 0:
                raise NotFound("거래처 정보를 찾을 수 없습니다.")

        flash("거래처 정보가 수정되었습니다.", "success")
        return redirect(url_for("customers.index"))

    return render_template("customers/form.html", mode="edit", form_state=form_state)


@bp.route("/<business_id>/delete", methods=["POST"])
def delete(business_id: str):
    with get_db() as conn:
        cursor = conn.execute(
            "DELETE FROM customers WHERE business_id = ?",
            (business_id,),
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise NotFound("삭제할 거래처를 찾을 수 없습니다.")

    flash("거래처가 삭제되었습니다.", "success")
    return redirect(url_for("customers.index"))


def _validate_customer_form(form_state: dict[str, str], *, allow_business_id_edit: bool = True) -> None:
    if allow_business_id_edit and not form_state["business_id"]:
        raise ValueError("사업자등록번호를 입력하세요.")
    if not form_state["company_name"]:
        raise ValueError("상호명을 입력하세요.")
    if not form_state["representative"]:
        raise ValueError("대표자를 입력하세요.")
    if not form_state["address"]:
        raise ValueError("주소를 입력하세요.")
    if not form_state["phone"]:
        raise ValueError("전화번호를 입력하세요.")
