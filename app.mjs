import {filterCatalogue,publisherWorkCounts} from './filter.mjs';

const $=id=>document.getElementById(id);
const fields={query:$('search'),category:$('category'),subcategory:$('subcategory'),company:$('company-select'),platform:$('platform'),from:$('from'),to:$('to'),voice:$('voice'),sort:$('sort')};
const label=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;el.textContent=text;return el};
const safeLink=(url,title)=>{const a=label('a','source-link',title);try{const u=new URL(url);if(['https:','http:'].includes(u.protocol)){a.href=u.href;a.target='_blank';a.rel='noopener noreferrer'}}catch{}return a};

function renderCard({work,versions}){
  const card=label('article','card','');
  const top=label('div','card-top','');
  top.append(label('span','year',String(work.firstYear)),label('span','category category-'+work.category,work.category));
  const title=label('h3','',work.title);
  const original=label('p','original',work.originalTitle);
  const intro=label('p','intro',work.synopsis);
  const meta=label('div','card-meta','');
  const companies=[...new Set(versions.flatMap(v=>v.publisherCompanies||[]))];
  const publisherLabel=companies.length ? companies.slice(0,2).join(' / ')+(companies.length>2?` 等 ${companies.length} 家`:'') : '非商业／未署商业厂商';
  meta.append(label('span','',`细分类 · ${work.subcategory}`),label('span','',work.genre),label('span','','主要角色 · '+(work.characters.length?work.characters.join(' / '):'待核实')),label('span','','发行厂商 · '+publisherLabel));
  card.append(top,title,original,intro,meta);
  const detail=document.createElement('details');detail.className='version-panel';
  const summary=label('summary','','查看 '+versions.length+' 个平台版本');detail.append(summary);
  const container=label('div','version-list','');
  for(const version of versions){
    const v=label('div','version','');
    const line=label('div','version-line','');
    line.append(label('strong','',String(version.year)),label('span','platform-name',version.platform),label('span','version-kind',version.kind));
    const publisher=label('p','publisher','发行／出版：'+version.publisher+'　·　角色配音：'+version.voice);
    const changes=label('p','changes',version.differences);
    v.append(line,publisher,changes,safeLink(version.source,'版本来源 ↗'));
    container.append(v);
  }
  detail.append(container);card.append(detail);
  const bottom=label('div','card-bottom','');bottom.append(safeLink(work.source,'作品来源 ↗'));
  if(work.notes)bottom.append(label('span','card-note',work.notes));
  card.append(bottom);
  return card;
}

function readFilters(){return Object.fromEntries(Object.entries(fields).map(([key,node])=>[key,node.value]))}

async function main(){
  try {
    const [response,taxonomyResponse]=await Promise.all([fetch('./data/games.json?v=20260928-3'),fetch('./data/taxonomy.json?v=20260928-3')]);
    if(!response.ok||!taxonomyResponse.ok)throw Error('HTTP '+(response.ok?taxonomyResponse.status:response.status));
    const [data,taxonomy]=await Promise.all([response.json(),taxonomyResponse.json()]);
    $('stat-works').textContent=data.works.length;
    $('stat-versions').textContent=data.versions.length;
    const years=data.versions.map(v=>v.year);$('stat-years').textContent=Math.min(...years)+'—'+Math.max(...years);
    const platforms=[...new Set(data.versions.map(v=>v.platform.trim()))].sort((a,b)=>a.localeCompare(b,'zh'));
    for(const p of platforms){const option=label('option','',p);option.value=p;fields.platform.append(option)}
    const companyCounts=publisherWorkCounts(data);
    const unattributed=companyCounts.get('__unattributed__')||0;
    companyCounts.delete('__unattributed__');
    const orderedCompanies=[...companyCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'zh'));
    for(const [company,count] of orderedCompanies){
      const option=label('option','',`${company} · ${count} 部游戏`);option.value=company;fields.company.append(option);
    }
    if(unattributed){const option=label('option','',`非商业／未署商业厂商 · ${unattributed} 部游戏`);option.value='__unattributed__';fields.company.append(option)}
    const fillSubcategories=()=>{
      const previous=fields.subcategory.value;
      const allOption=label('option','','全部细分类');allOption.value='';
      fields.subcategory.replaceChildren(allOption);
      const categories=fields.category.value?[fields.category.value]:Object.keys(taxonomy.subcategories);
      for(const category of categories){
        const parent=fields.category.value?fields.subcategory:document.createElement('optgroup');
        if(parent!==fields.subcategory)parent.label=category;
        for(const name of taxonomy.subcategories[category]){const option=label('option','',name);option.value=name;parent.append(option)}
        if(parent!==fields.subcategory)fields.subcategory.append(parent);
      }
      fields.subcategory.value=categories.some(category=>taxonomy.subcategories[category].includes(previous))?previous:'';
    };
    fillSubcategories();
    const render=()=>{
      const matches=filterCatalogue(data,readFilters());
      const count=matches.reduce((n,item)=>n+item.versions.length,0);
      $('result-count').textContent=`显示 ${matches.length} 部作品 · ${count} 个平台版本`;
      $('empty').hidden=matches.length>0;
      $('cards').replaceChildren(...matches.map(renderCard));
      for(const button of $('company-quick-list').querySelectorAll('button')){
        button.setAttribute('aria-pressed',String(button.value===fields.company.value));
      }
    };
    for(const [name,count] of [['',data.works.length],...orderedCompanies.slice(0,8)]){
      const button=label('button','',name?`${name} · ${count} 部游戏`:`全部厂商 · ${count} 部游戏`);
      button.type='button';button.value=name;
      button.addEventListener('click',()=>{fields.company.value=name;render()});
      $('company-quick-list').append(button);
    }
    for(const [key,node] of Object.entries(fields)){
      node.addEventListener(key==='query'||key==='from'||key==='to'?'input':'change',()=>{
        if(key==='category')fillSubcategories();
        if(key==='subcategory' && !fields.category.value && fields.subcategory.value){
          fields.category.value=Object.keys(taxonomy.subcategories).find(category=>taxonomy.subcategories[category].includes(fields.subcategory.value))||'';
          fillSubcategories();
        }
        render();
      });
    }
    $('clear').addEventListener('click',()=>{for(const [key,node] of Object.entries(fields))node.value=key==='sort'?'oldest':'';fillSubcategories();render();fields.query.focus()});
    render();
  }catch(error){$('result-count').textContent='数据加载失败';$('empty').hidden=false;$('empty').querySelector('span').textContent='请从 GitHub Pages 或本地 HTTP 服务访问；'+error.message}
}
main();
