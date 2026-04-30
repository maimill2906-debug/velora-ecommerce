from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import NewType
from uuid import UUID


EntityId = NewType("EntityId", UUID)


@dataclass(frozen=True, slots=True)
class AuditedTimestamps:
    created_at: datetime
    updated_at: datetime

