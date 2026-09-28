"""Regenerate the spreadsheet friendly version index from games.json."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/games.json').read_text(encoding='utf-8'))
works = {work['id']: work for work in data['works']}

fields = ['作品ID', '版本ID', '作品名称', '原文名称', '主分类', '细分类', '游戏类型',
          '主要角色', '发行年份', '平台', '发行公司', '发行厂商归档', '版本类型', '配音', '版本差异', '来源']
with (ROOT / 'data/versions.csv').open('w', encoding='utf-8-sig', newline='') as file:
    writer = csv.DictWriter(file, fieldnames=fields)
    writer.writeheader()
    for version in data['versions']:
        work = works[version['workId']]
        writer.writerow(dict(zip(fields, [
            work['id'], version['id'], work['title'], work['originalTitle'],
            work['category'], work['subcategory'], work['genre'], '、'.join(work['characters']) or '待核实',
            version['year'], version['platform'], version['publisher'],
            '、'.join(version['publisherCompanies']) or '非商业／未署商业厂商',
            version['kind'], version['voice'], version['differences'], version['source'],
        ])))
print(f"已生成 {len(data['versions'])} 行平台版本数据")
