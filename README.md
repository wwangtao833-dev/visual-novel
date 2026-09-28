# 叙事游戏年鉴

文字冒险、视觉小说、互动动画与 Galgame 的可检索资料库。每部作品有一条作品记录和一个细分类；每个平台发行版本单独记录 **年份、发行公司、归档厂商、类型、主要角色、配音、移植／重制差异与来源**。网页支持主分类 → 细分类、发行厂商、平台与年份联动筛选。

## 数据范围

当前收录 **194 部代表作品、368 个平台版本**，覆盖 1976—2026 年，重点补充了 1970 年代文字冒险的起点、1980—1985 年的早期作品，以及按发行厂商核查的 KID、TYPE-MOON、Key、NOVECT、Leaf、AQUAPLUS、Konami、Chunsoft、世嘉、Spike Chunsoft、Capcom、Nitroplus 和 07th Expansion 等作品。此项目不是完整历史清单；缺乏可靠版本信息的地方保持“待核实”。首发年份取所收录的最早版本；平台移植与重制按所引来源的发行地区记录，尚未逐一列出所有地区的发售时间。早期作品的日期异文与收录原则见 [`data/early-era-notes.md`](data/early-era-notes.md)。

作品主分类是一种检索入口，并非互斥的学术分类：一部恋爱视觉小说也可能属于广义 Galgame。视觉小说的“有声小说”可能只有音乐和音效，配音字段专指游戏内角色人声。

## 厂商集中整理

已更新 [Key 品牌专题](key.html)：**27 部已核实的相关游戏**，其中 21 部属于主数据库四类作品及外传，5 部为 Key 官方年表／产品目录中的跨类型游戏（《绯染天空》、两款《Angel Beats!》手机游戏、《Little Busters! Card Mission》和《Rewrite IgnisMemoria》），1 部为官网宣传、由 Index 制作的授权游戏《Key COLLECTION》。跨类型及授权作品另存于专题数据中，分别标注实际发行公司和平台，不混入主数据库的四类筛选。已逐项核对现行产品目录 30 项，并依据 Key 官方年表补查旧手机游戏、补入《CLANNAD 光守护的坡道》。动画、网页小说、增强版和待发行项目均有对应说明。作品层级的核查范围限于这些官方资料；各地区版本及其他授权衍生游戏仍可继续核实。

- [`data/company-coverage.json`](data/company-coverage.json)：专题作品 ID、跨类型游戏及其平台记录、核对日期、来源、收录／排除／待发行状态。
- `scripts/build_company_pages.py`：从统一数据生成静态专题页；`--check` 检查页面与数据同步。

## 分类与厂商索引

| 主分类 | 作品细分类 |
| --- | --- |
| 文字冒险 | 纯文本指令、图文指令、图文选项／调查、光盘图文冒险 |
| 视觉小说 | 有声小说、恋爱剧情、剧情分支／冒险、推理解谜融合、单线视觉小说 |
| 互动动画 | 激光影碟·动作选择、激光影碟·射击／驾驶、全动画·剧情分支 |
| Galgame | 早期成人向互动、成人向冒险、美少女探索冒险、恋爱剧情冒险、恋爱模拟 |

细分类选每部作品的主要玩法／呈现方式，类型 `genre` 保留具体题材。角色配音是**版本**字段，不能据此判断“有声小说”是否有人声。发行厂商也按版本归档：`publisher` 原样保留来源中的发行署名，`publisherCompanies` 是用于筛选的厂商名称列表；联名发行可出现在多个厂商下。网页中的厂商数字按不同游戏计数，同一游戏的多个版本在同一厂商名下只计一次，筛选结果仍逐平台显示版本。`data/taxonomy.json` 收录细分类与少量中日文别名。作者传播而未署商业厂商的版本归入专门的筛选选项；开发公司仅在来源明确且以后新增专用字段时再独立归档。

## 文件

- [`data/games.json`](data/games.json)：作品 `works` 与平台版本 `versions`，以 `workId` 关联；适合程序读取。
- [`data/taxonomy.json`](data/taxonomy.json)：四大分类下的细分类、发行厂商别名与联名署名映射。
- [`data/versions.csv`](data/versions.csv)：一行一个版本，含作品及版本 ID、作品字段与核查来源；适合 Excel。
- [`data/early-era-notes.md`](data/early-era-notes.md)：1985 年及以前的增补范围、日期异文与待核项目。
- `index.html`、`app.mjs`、`filter.mjs`、`styles.css`：无需后端和构建工具的静态检索站。
- `scripts/sync_versions_csv.py`：从 JSON 生成 CSV；`scripts/validate_data.py`：校验数据结构、年份和 CSV 各字段。已提交的 JSON/CSV 为公开数据源。

## 本地运行

在仓库目录执行 `python3 -m http.server 8000`，访问 `http://localhost:8000`。页面使用 `fetch` 加载 JSON，直接打开本地 `file://` 地址不会正常读取数据。

## 发布到 GitHub Pages

在仓库设置 **Settings → Pages**，选择 **Deploy from a branch → main / (root)**。站点将从仓库根目录的 `index.html` 发布。若需保持仓库私有，请先核查账号的 Pages 可见性与组织策略；不要把私有仓库的 Pages 地址当作权限保护措施。

## 扩充规则

1. 为新作品添加唯一 `id`，提供首发年份、主分类、`subcategory`、主要角色及作品来源。细分类必须列于 `data/taxonomy.json` 对应主分类下；无可靠角色资料时保持空数组并备注“待核实”。
2. 新平台版本添加唯一 `id` 和 `workId`；记录**该版本**发行年份、平台、当时发行方、`publisherCompanies` 厂商归档列表、语音状态、版本差异和来源。多厂商联合发行依据来源标注；作者传播记 `[]`。不要把移植年份或新增配音套在原版上。
3. 运行 `python3 scripts/sync_versions_csv.py` 更新 CSV，再运行 `python3 scripts/validate_data.py` 与 `node --test tests/filter.test.mjs`；更新专题时运行 `python3 scripts/build_company_pages.py`，再运行同一命令加 `--check`；检查页面筛选是否显示新版本。
4. 后续优先逐个厂商完成作品目录核对；按厂商扩充时，**不新增“图文指令”和“纯文本指令”作品**；既有历史条目继续保留供查询。“图文选项／调查”及其他符合范围的视觉小说、Galgame 与互动动画可继续核查收录。
5. 历史发行厂商按作品当年的署名保留。例如《善人シボウデス》2012 年版本署名 **CHUNSOFT**，筛选索引统一归入 **Chunsoft**；不得因现今官网域名属于 Spike Chunsoft 而合并两个不同历史厂商。

作品资料只作索引与历史考证，不提供游戏内容下载。

已新增 [NOVECT（原 Novectacle）厂商专题](novect.html)：对照开发团队官方四作合集收录 **4 部独立视觉小说、20 条平台版本记录**。四作分别为 2011 年《霧上のエラスムス》、2012 年《ファタモルガーナの館》、2013 年《セブンスコート》、2015 年《ファタモルガーナの館 -Another Episode-》。2017 年主机合集“现代篇”仅作为版本内容，配音仅在该篇；2020 年合集亦按版本而非第五作计数。专题清单另说明动作游戏与开发企划的排除理由；具体地区及移动端移植尚可继续补查。
