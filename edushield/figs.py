"""Research figure entry point, sharing the document's reproducible figure source."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).resolve().parents[1]/'paper/script/figures.py'),run_name='__main__')
