# 叙事游戏年鉴

文字冒险、视觉小说、互动动画与 Galgame 的可检索资料库。每部作品有一条作品记录，每个平台发行版本单独记录 **年份、发行公司、类型、主要角色、配音、移植／重制差异与来源**。

## 数据范围

当前收录 **56 部代表作品、127 个平台版本**，覆盖 1980—2025 年，含 1982—1985 年早期作品。此项目不是完整历史清单；早期作品缺乏可靠版本信息的地方保持“待核实”。记录以日本发行时间为主；跨地区发行未逐一列出。

作品主分类是一种检索入口，并非互斥的学术分类：一部恋爱视觉小说也可能属于广义 Galgame。视觉小说的“有声小说”可能只有音乐和音效，配音字段专指游戏内角色人声。

## 文件

- [`data/games.json`](data/games.json)：作品 `works` 与平台版本 `versions`，以 `workId` 关联；适合程序读取。
- [`data/versions.csv`](data/versions.csv)：一行一个版本，含作品及版本 ID、作品字段与核查来源；适合 Excel。
- `index.html`、`app.mjs`、`filter.mjs`、`styles.css`：无需后端和构建工具的静态检索站。
- `scripts/sync_versions_csv.py`：从 JSON 生成 CSV；`scripts/validate_data.py`：校验数据结构、年份和 CSV 各字段。已提交的 JSON/CSV 为公开数据源。

## 本地运行

在仓库目录执行 `python3 -m http.server 8000`，访问 `http://localhost:8000`。页面使用 `fetch` 加载 JSON，直接打开本地 `file://` 地址不会正常读取数据。

## 发布到 GitHub Pages

在仓库设置 **Settings → Pages**，选择 **Deploy from a branch → main / (root)**。站点将从仓库根目录的 `index.html` 发布。若需保持仓库私有，请先核查账号的 Pages 可见性与组织策略；不要把私有仓库的 Pages 地址当作权限保护措施。

## 扩充规则

1. 为新作品添加唯一 `id`，提供首发年份、主要角色及作品来源。无可靠角色资料时保持空数组并备注“待核实”。
2. 新平台版本添加唯一 `id` 和 `workId`；记录**该版本**发行年份、平台、当时发行方、语音状态、版本差异和来源。不要把移植年份或新增配音套在原版上。
3. 运行 `python3 scripts/sync_versions_csv.py` 更新 CSV，再运行 `python3 scripts/validate_data.py` 与 `node --test tests/filter.test.mjs`；检查页面筛选是否显示新版本。

作品资料只作索引与历史考证，不提供游戏内容下载。
