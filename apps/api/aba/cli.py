"""python -m aba.cli migrate | reset | setup"""
from __future__ import annotations

import sys

from .db import migrate, reset_demo


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd in ("migrate", "setup"):
        print("migrations applied:", migrate() or "none (up to date)")
    if cmd in ("reset", "setup"):
        reset_demo()
        print("demo data installed")
    if cmd not in ("migrate", "reset", "setup"):
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
