"""Refresh static boat entry pages after editing index.html."""
from pathlib import Path
root = Path(__file__).resolve().parent
source = (root / 'index.html').read_text()
for route in ('sail', 'yacht', 'xo270'):
    folder = root / route
    folder.mkdir(exist_ok=True)
    (folder / 'index.html').write_text(source)
