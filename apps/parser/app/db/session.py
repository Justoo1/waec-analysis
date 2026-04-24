"""
Async PostgreSQL session management via asyncpg.
Supports tenant schema isolation via search_path.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg

_DATABASE_URL = os.environ.get("DATABASE_URL", "")


async def get_connection() -> asyncpg.Connection:
    """Raw asyncpg connection to the public schema."""
    return await asyncpg.connect(_DATABASE_URL)


@asynccontextmanager
async def tenant_connection(
    school_number: str,
) -> AsyncGenerator[asyncpg.Connection, None]:
    """
    Async context manager yielding an asyncpg connection with
    search_path set to ``tenant_{school_number},public``.

    Usage::

        async with tenant_connection("0040103") as conn:
            rows = await conn.fetch("SELECT * FROM candidates LIMIT 10")
    """
    conn = await asyncpg.connect(_DATABASE_URL)
    try:
        schema = f"tenant_{school_number}"
        await conn.execute(f"SET search_path TO {schema}, public")
        yield conn
    finally:
        await conn.close()
