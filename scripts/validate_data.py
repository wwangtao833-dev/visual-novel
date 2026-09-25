"""Validate catalogue relationships and the exported CSV."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/games.json').read_text(encoding='utf-8'))
works, versions = data['works'], data['versions']
work_ids = {work['id'] for work in works}
version_ids = {version['id'] for version in versions}
assert len(work_ids) == len(works) and len(version_ids) == len(versions), '重复 ID'
assert {work['category'] for work in works} == {'文字冒险', '视觉小说', '互动动画', 'Galgame'}
assert all(1976 <= version['year'] <= 2026 and version['workId'] in work_ids for version in versions)
assert all(version['publisher'] and version['platform'] and version['source'].startswith('https://')
           and version['voice'] in {'有', '无', '未核实', '有（部分）', '有（主角部分）'} for version in versions)
assert all(work['source'].startswith('https://') and isinstance(work['characters'], list)
           and work['genre'] for work in works)
for work in works:
    years = [version['year'] for version in versions if version['workId'] == work['id']]
    assert years and min(years) == work['firstYear'], f"{work['title']} 首发年份与平台版本冲突"

with (ROOT / 'data/versions.csv').open(encoding='utf-8-sig', newline='') as file:
    rows = list(csv.DictReader(file))
assert len(rows) == len(versions), 'CSV 与 JSON 条数不一致'
assert len({row['版本ID'] for row in rows}) == len(rows), 'CSV 中版本 ID 重复'
for version, row in zip(versions, rows):
    work = next(work for work in works if work['id'] == version['workId'])
    assert row['作品ID'] == work['id'] and row['版本ID'] == version['id']
    assert row['作品名称'] == work['title'] and row['主分类'] == work['category']
    assert row['游戏类型'] == work['genre']
    assert row['主要角色'] == ('、'.join(work['characters']) or '待核实')
    assert str(version['year']) == row['发行年份']
    for key, field in [('platform', '平台'), ('publisher', '发行公司'),
                       ('kind', '版本类型'), ('voice', '配音'),
                       ('differences', '版本差异'), ('source', '来源')]:
        assert version[key] == row[field], f"{version['id']} 的 {field} 与 JSON 不一致"
print(f"校验通过：{len(works)} 部作品，{len(versions)} 个平台版本")
