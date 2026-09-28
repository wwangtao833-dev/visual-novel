"""Build static, source-linked company dossiers from the shared catalogue."""
import argparse
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/games.json').read_text(encoding='utf-8'))
coverage = json.loads((ROOT / 'data/company-coverage.json').read_text(encoding='utf-8'))
works = {work['id']: work for work in data['works']}
escape = html.escape


def link(url, title):
    assert url.startswith('https://')
    return f'<a class="source-link" href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">{escape(title)} ↗</a>'


def card(work, versions=None):
    if versions is None:
        versions = [v for v in data['versions'] if v['workId'] == work['id']]
    versions = sorted(versions, key=lambda v: v['year'])
    release_rows = []
    for v in versions:
        release_rows.append(f'''<div class="version">
<div class="version-line"><strong>{v['year']}</strong><span class="platform-name">{escape(v['platform'])}</span><span class="version-kind">{escape(v['kind'])}</span></div>
<p class="publisher">发行／出版：{escape(v['publisher'])} · 角色配音：{escape(v['voice'])}</p>
<p class="changes">{escape(v['differences'])}</p>{link(v['source'], '版本来源')}</div>''')
    return f'''<article class="card" id="{work['id']}">
<div class="card-top"><span class="year">{work['firstYear']}</span><span class="category">{escape(work['category'])}</span></div>
<h3>{escape(work['title'])}</h3><p class="original">{escape(work['originalTitle'])}</p>
<p class="intro">{escape(work['synopsis'])}</p>
<div class="card-meta"><span>{escape(work['subcategory'])} · {escape(work['genre'])}</span><span>主要角色 · {escape(' / '.join(work['characters']) or '待核实')}</span></div>
<details class="version-panel"><summary>查看 {len(versions)} 个平台版本</summary><div class="version-list">{''.join(release_rows)}</div></details>
<div class="card-bottom">{link(work['source'], '作品来源')}<span class="card-note">{escape(work['notes'])}</span></div></article>'''


def build(company):
    selected = sorted((works[wid] for wid in company['workIds']), key=lambda w: (w['firstYear'], w['id']))
    related = sorted(company.get('relatedGames', []), key=lambda w: (w['firstYear'], w['id']))
    count_versions = sum(v['workId'] in company['workIds'] for v in data['versions']) + sum(len(g['versions']) for g in related)
    toc = ''.join(f'<a href="#{w["id"]}"><span>{w["firstYear"]}</span>{escape(w["title"])}</a>'
                  for w in sorted(selected + related, key=lambda w: (w['firstYear'], w['id'])))
    related_by_id = {game['id']: game for game in related}
    audit_rows = []
    for item in company['entries']:
        references = ' / '.join([*(f'<a href="#{wid}">{escape(works[wid]["title"])}</a>' for wid in item['workIds']),
                                *(f'<a href="#{rid}">{escape(related_by_id[rid]["title"])}</a>' for rid in item.get('relatedIds', []))])
        audit_rows.append(f'<tr><th scope="row">{escape(item["title"])}</th><td>{escape(item["status"])}</td><td>{escape(item["reason"])}<div>{references}</div></td><td>{link(item["source"], "来源")}</td></tr>')
    return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Key 叙事游戏作品专题：剧情、主要角色、首发年份、平台版本与官方目录核对清单。">
<title>{escape(company['name'])} 作品专题 · 叙事游戏年鉴</title>
<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="company.css"></head>
<body><div class="app-shell"><header class="masthead"><a class="brand" href="index.html"><span class="brand-mark">N.</span><span>叙事游戏年鉴</span></a><nav aria-label="专题导航"><a href="#works">全部作品</a><a href="#coverage">核对清单</a><a href="index.html#catalogue">返回数据库</a></nav></header>
<main><section class="company-hero"><p class="eyebrow">COMPANY DOSSIER · {escape(company['checkedAt'])}</p><h1>{escape(company['name'])} 作品专题</h1>
<p class="lead">{escape(company['publisherNote'])}</p>
<div class="overview"><div><strong>{len(selected) + len(related)}</strong><span>已核实的相关游戏（含授权）</span></div><div><strong>{count_versions}</strong><span>已核实版本记录</span></div><div><strong>{selected[0]['firstYear']}—{max(w['firstYear'] for w in selected + related)}</strong><span>作品首发跨度</span></div></div>
<p class="scope-note">{escape(company['scope'])}</p><p class="scope-note">{escape(company['versionScope'])}</p>
<div class="hero-links"><a class="primary-link" href="#works">按年份阅读作品</a><a class="secondary-link" href="#coverage">查看目录核对说明</a></div></section>
<section id="works"><div class="section-heading"><div><p class="eyebrow">KEY GAME CATALOGUE</p><h2>从 Kanon 到 anemoi</h2></div><p>{len(selected)} 部四类作品 · 增强版合并计数</p></div>
<nav class="work-index" aria-label="按年份跳转作品">{toc}</nav><div class="cards">{''.join(card(w) for w in selected)}</div></section>
<section class="related-games" id="related-games"><div class="section-heading"><div><p class="eyebrow">OTHER KEY GAMES</p><h2>跨类型合作游戏</h2></div><p>{len(related)} 部 · 按官方类型标注</p></div>
<p class="related-intro">涵盖官方年表收录的手机游戏、WFS 合作 RPG，以及 Index 制作、Key 官网宣传的授权作品。每款游戏按实际类型、发行公司与平台标注；顶部总数包含本节。</p>
<div class="cards">{''.join(card(g, g['versions']) for g in related)}</div></section>
<section class="company-audit" id="coverage"><p class="eyebrow">CATALOGUE AUDIT</p><h2>官网目录核对清单</h2>
<p>核对日期：{escape(company['checkedAt'])} · 官网目录 {company['catalogueEntryCount']} 项，另补充外传与待发行项目。{link(company['source'], '官方产品目录')}</p>
<p class="scope-note">“核对完成”指上述目录中每项内容都有处理记录。已发行的跨类型游戏在专题另列；未确认发售的项目和非游戏媒介不计入已发行游戏数。</p>
<div class="audit-scroll"><table><thead><tr><th>官网项目／补充项目</th><th>处理</th><th>说明与对应作品</th><th>证据</th></tr></thead><tbody>{''.join(audit_rows)}</tbody></table></div></section>
</main><footer><span>Key 专题 · 与主数据库共用作品和版本记录</span><a href="index.html#catalogue">返回数据库 ↑</a></footer></div></body></html>
'''


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='Fail if generated pages are outdated')
    args = parser.parse_args()
    for company in coverage['companies']:
        target = ROOT / f'{company["id"]}.html'
        output = build(company)
        if args.check:
            assert target.read_text(encoding='utf-8') == output, f'{target.name} 未与 JSON 同步'
        else:
            target.write_text(output, encoding='utf-8')
        print(f'{target.name}: {len(company["workIds"]) + len(company.get("relatedGames", []))} 部相关游戏，已同步')
