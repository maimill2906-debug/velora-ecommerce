from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from uuid import UUID


class SalesChannel(str, Enum):
    website = "website"
    shopee = "shopee"
    store = "store"


@dataclass(frozen=True, slots=True)
class ChannelSyncState:
    """
    Track sync state for external sales channels (future; no external services yet).
    """

    id: UUID
    channel: SalesChannel
    last_synced_at: datetime | None
    last_cursor: str | None
    created_at: datetime
    updated_at: datetime

