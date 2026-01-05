from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from typing import Any, Iterable

from modules.db_manager import DB_PATH


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db() -> Iterable[sqlite3.Connection]:
    conn = _connect()
    try:
        yield conn
    finally:
        conn.close()


def fetch_all(query: str, params: Iterable[Any] | None = None) -> list[sqlite3.Row]:
    with get_db() as conn:
        cur = conn.execute(query, params or [])
        return cur.fetchall()


def fetch_one(query: str, params: Iterable[Any] | None = None) -> sqlite3.Row | None:
    with get_db() as conn:
        cur = conn.execute(query, params or [])
        return cur.fetchone()


def execute(query: str, params: Iterable[Any] | None = None) -> int:
    with get_db() as conn:
        cur = conn.execute(query, params or [])
        conn.commit()
        return cur.lastrowid


def executemany(query: str, seq_of_params: Iterable[Iterable[Any]]) -> None:
    with get_db() as conn:
        conn.executemany(query, seq_of_params)
        conn.commit()
