from __future__ import annotations

import sys
from pathlib import Path

import pytest

AI_ROOT = Path(__file__).resolve().parents[1]
TESTS_ROOT = Path(__file__).resolve().parent
for p in (AI_ROOT, TESTS_ROOT):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from helpers import adzuna_handler_factory, build_runner, make_job


@pytest.fixture
def tmp_checkpoint(tmp_path):
    return str(tmp_path / "checkpoints.db")
