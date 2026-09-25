import {filterCatalogue} from './filter.mjs';

const $=id=>document.getElementById(id);
const fields={query:$('search'),category:$('category'),platform:$('platform'),from:$('from'),to:$('to'),voice:$('voice'),sort:$('sort')};
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
  meta.append(label('span','',work.genre),label('span','','主要角色 · '+(work.characters.length?work.characters.join(' / '):'待核实')));
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
    const response=await fetch('./data/games.json');if(!response.ok)throw Error('HTTP '+response.status);
    const data=await response.json();
    $('stat-works').textContent=data.works.length;
    $('stat-versions').textContent=data.versions.length;
    const years=data.versions.map(v=>v.year);$('stat-years').textContent=Math.min(...years)+'—'+Math.max(...years);
    const platforms=[...new Set(data.versions.flatMap(v=>v.platform.split(/\s*\/\s*/).map(p=>p.trim())))].sort((a,b)=>a.localeCompare(b,'zh'));
    for(const p of platforms){const option=label('option','',p);option.value=p;fields.platform.append(option)}
    const render=()=>{
      const matches=filterCatalogue(data,readFilters());
      const count=matches.reduce((n,item)=>n+item.versions.length,0);
      $('result-count').textContent=`显示 ${matches.length} 部作品 · ${count} 个平台版本`;
      $('empty').hidden=matches.length>0;
      $('cards').replaceChildren(...matches.map(renderCard));
    };
    for(const [key,node] of Object.entries(fields))node.addEventListener(key==='query'||key==='from'||key==='to'?'input':'change',render);
    $('clear').addEventListener('click',()=>{for(const [key,node] of Object.entries(fields))node.value=key==='sort'?'oldest':'';render();fields.query.focus()});
    render();
  }catch(error){$('result-count').textContent='数据加载失败';$('empty').hidden=false;$('empty').querySelector('span').textContent='请从 GitHub Pages 或本地 HTTP 服务访问；'+error.message}
}
main();
