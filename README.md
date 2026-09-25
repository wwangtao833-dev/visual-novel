# 叙事游戏年鉴

文字冒险、视觉小说、互动动画与 Galgame 的可检索资料库。每部作品有一条作品记录，每个平台发行版本单独记录 **年份、发行公司、类型、主要角色、配音、移植／重制差异与来源**。

## 数据范围

当前收录 **112 部代表作品、209 个平台版本**，覆盖 1976—2025 年，重点补充了 1970 年代文字冒险的起点，以及 1980—1985 年的欧美文字／图文冒险、日本 PC 冒险与激光影碟互动动画。此项目不是完整历史清单；早期作品缺乏可靠版本信息的地方保持“待核实”。首发年份取所收录的最早版本；平台移植与重制按所引来源的发行地区记录，尚未逐一列出所有地区的发售时间。早期作品的日期异文与收录原则见 [`data/early-era-notes.md`](data/early-era-notes.md)。

作品主分类是一种检索入口，并非互斥的学术分类：一部恋爱视觉小说也可能属于广义 Galgame。视觉小说的“有声小说”可能只有音乐和音效，配音字段专指游戏内角色人声。

## 文件

- [`data/games.json`](data/games.json)：作品 `works` 与平台版本 `versions`，以 `workId` 关联；适合程序读取。
- [`data/versions.csv`](data/versions.csv)：一行一个版本，含作品及版本 ID、作品字段与核查来源；适合 Excel。
- [`data/early-era-notes.md`](data/early-era-notes.md)：1985 年及以前的增补范围、日期异文与待核项目。
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
