"""Source checks run by build.py before the DOCX is assembled. Figure label overlap is checked in figures.py."""
import re


def check_source(name, text, num):
    assert '—' not in text, f'{name}: em dash found (style rule: no em dash)'
    keys = set(re.findall(r'\{\{(.*?)\}\}', text))
    assert keys <= num.keys(), f'{name}: unregistered numbers {keys - num.keys()}'
    for line in text.splitlines():
        if line.startswith('[FIG ') or line.startswith('[TABLE '):
            assert '|' in line and line.endswith(']'), f'{name}: malformed block {line[:60]}'


def check_crossrefs(body):
    """Every body figure/table is cited in the prose, in order, so numbers in the text match the captions."""
    prose = '\n'.join(l for l in body.splitlines() if not l.startswith('['))
    n_fig = sum(l.startswith('[FIG ') for l in body.splitlines())
    n_tab = sum(l.startswith('[TABLE ') for l in body.splitlines())
    for i in range(1, n_fig + 1):
        assert f'Gambar {i}' in prose, f'Gambar {i} is never referenced in the text'
    for i in range(1, n_tab + 1):
        assert f'Tabel {i}' in prose, f'Tabel {i} is never referenced in the text'
    assert f'Gambar {n_fig + 1}' not in prose and f'Tabel {n_tab + 1}' not in prose, 'text cites a figure/table that does not exist'
