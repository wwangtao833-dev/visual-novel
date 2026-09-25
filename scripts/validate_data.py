import csv
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data/games.json').read_text(encoding='utf-8'))
works=data['works'];versions=data['versions']
work_ids={w['id'] for w in works};version_ids={v['id'] for v in versions}
assert len(work_ids)==len(works) and len(version_ids)==len(versions),'重复 ID'
assert len(works)==40 and len(versions)==75,'作品与版本数变化，请同步更新 README'
assert {w['category'] for w in works}=={'文字冒险','视觉小说','互动动画','Galgame'}
assert all(1980<=v['year']<=2026 and v['workId'] in work_ids for v in versions)
assert all(v['publisher'] and v['platform'] and v['source'].startswith('https://') for v in versions)
assert all(w['source'].startswith('https://') and isinstance(w['characters'],list) for w in works)
for w in works:
    years=[v['year'] for v in versions if v['workId']==w['id']]
    assert years and min(years)==w['firstYear'],f"{w['title']} 首发年份与平台版本冲突"
with (ROOT/'data/versions.csv').open(encoding='utf-8-sig',newline='') as f:
    rows=list(csv.DictReader(f))
assert len(rows)==len(versions),'CSV 与 JSON 条数不一致'
for version,row in zip(versions,rows):
    assert str(version['year'])==row['发行年份'] and version['platform']==row['平台'] and version['publisher']==row['发行公司']
print(f"校验通过：{len(works)} 部作品，{len(versions)} 个平台版本")
