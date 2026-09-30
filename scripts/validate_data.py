"""Validate catalogue relationships and the exported CSV."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/games.json').read_text(encoding='utf-8'))
taxonomy = json.loads((ROOT / 'data/taxonomy.json').read_text(encoding='utf-8'))
works, versions = data['works'], data['versions']
work_ids = {work['id'] for work in works}
version_ids = {version['id'] for version in versions}
assert len(work_ids) == len(works) and len(version_ids) == len(versions), '重复 ID'
assert {work['category'] for work in works} == {'文字冒险', '视觉小说', '互动动画', 'Galgame'}
assert set(taxonomy['subcategories']) == {work['category'] for work in works}
assert all(work['subcategory'] in taxonomy['subcategories'][work['category']] for work in works)
assert all(work['subcategory'] not in {'纯文本指令', '图文指令'}
           for work in works if int(work['id'][1:]) >= 152), '厂商续补不再新增指令类游戏'
assert all(any(work['subcategory'] == value for work in works) for category in taxonomy['subcategories']
           for value in taxonomy['subcategories'][category]), '存在空的细分类'
assert all(1976 <= version['year'] <= 2026 and version['workId'] in work_ids for version in versions)
assert all(version['publisher'] and version['platform'] and version['source'].startswith('https://')
           and version['voice'] in {'有', '无', '未核实', '有（部分）', '有（主角部分）'} for version in versions)
for version in versions:
    companies = version['publisherCompanies']
    assert isinstance(companies, list) and all(isinstance(c, str) and c for c in companies)
    assert len(companies) == len(set(companies))
    raw = version['publisher']
    if raw in taxonomy['nonCompanyCredits']:
        assert companies == [], f'{version["id"]} 作者传播不应归入商业厂商'
    elif raw in taxonomy['jointCredits']:
        assert companies == taxonomy['jointCredits'][raw], f'{version["id"]} 联名发行厂商不一致'
    else:
        assert companies == [taxonomy['publisherAliases'].get(raw, raw)], f'{version["id"]} 厂商别名不一致'
assert all(work['source'].startswith('https://') and isinstance(work['characters'], list)
           and work['characters'] and all(name and '待核实' not in name for name in work['characters'])
           and work['genre'] for work in works), '每部作品必须有可显示的角色或原作身份'
assert all(not work.get('charactersNote', '').find('待核实') >= 0 for work in works)
assert all(isinstance(work.get('chineseTitle', ''), str) and
           isinstance(work.get('titleAliases', []), list) for work in works)
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
    assert row['中文名称'] == work.get('chineseTitle', '')
    assert row['细分类'] == work['subcategory']
    assert row['游戏类型'] == work['genre']
    assert row['发行厂商归档'] == ('、'.join(version['publisherCompanies']) or '非商业／未署商业厂商')
    assert row['主要角色'] == '、'.join(work['characters'])
    assert str(version['year']) == row['发行年份']
    assert row['角色配音标注'] == ('无角色配音' if version['voice'] == '无' else '')
    for key, field in [('platform', '平台'), ('publisher', '发行公司'),
                       ('kind', '版本类型'),
                       ('differences', '版本差异'), ('source', '来源')]:
        assert version[key] == row[field], f"{version['id']} 的 {field} 与 JSON 不一致"
coverage = json.loads((ROOT / 'data/company-coverage.json').read_text(encoding='utf-8'))
for company in coverage['companies']:
    profile = company['creativeProfile']
    assert profile['thesis'] and len(profile['phases']) >= 2
    assert all(p['period'] and p['heading'] and p['analysis'] and
               p['basis'] in {'厂商说明', '编辑观察'} and p['source'].startswith('https://')
               for p in profile['phases'])
    ids = company['workIds']
    assert len(ids) == len(set(ids)) and set(ids) <= work_ids, '厂商专题作品 ID 不正确'
    if 'publisherWorkIds' in company:
        credited = {version['workId'] for version in versions
                    if company['name'] in version['publisherCompanies'] and version['workId'] in ids}
        assert set(company['publisherWorkIds']) == credited, '厂商专题发行署名计数与版本记录不一致'
    related = company.get('relatedGames', [])
    related_ids = {game['id'] for game in related}
    assert len(related_ids) == len(related) and not related_ids & work_ids, '跨类型作品 ID 冲突'
    for game in related:
        assert game['source'].startswith('https://') and game['genre'] and game['characters']
        assert all(name and '待核实' not in name for name in game['characters'])
        assert game['category'] not in taxonomy['subcategories'], '跨类型游戏应放在四类主目录之外'
        assert game['versions'] and min(v['year'] for v in game['versions']) == game['firstYear']
        assert all(v['platform'] and v['publisher'] and v['differences'] and
                   v['source'].startswith('https://') and v['voice'] in {'有', '无', '未核实', '有（部分）'}
                   for v in game['versions'])
    assert company['catalogueEntryCount'] <= len(company['entries'])
    covered, related_covered = set(), set()
    for entry in company['entries']:
        assert entry['source'].startswith('https://') and entry['reason']
        assert set(entry['workIds']) <= set(ids), '核对清单与专题作品不一致'
        assert set(entry.get('relatedIds', [])) <= related_ids, '核对清单的跨类型作品不存在'
        covered.update(entry['workIds'])
        related_covered.update(entry.get('relatedIds', []))
    assert covered == set(ids) and related_covered == related_ids, '专题存在缺少核对来源的作品'
    assert all(work['subcategory'] not in {'纯文本指令', '图文指令'} for work in works if work['id'] in ids)
print(f"校验通过：{len(works)} 部作品，{len(versions)} 个平台版本；厂商专题引用一致")
