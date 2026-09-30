export const normalize = (value) => String(value ?? '').normalize('NFKC').replace(/[’‘]/g, "'").toLocaleLowerCase().replace(/\s+/g, '');
export const visibleVoiceNote = (version) => version.voice === '无' ? '无角色配音' : '';

export function publisherWorkCounts(data) {
  const counts=new Map();
  for(const version of data.versions) {
    const companies=version.publisherCompanies?.length ? version.publisherCompanies : ['__unattributed__'];
    for(const company of companies) {
      if(!counts.has(company)) counts.set(company,new Set());
      counts.get(company).add(version.workId);
    }
  }
  return new Map([...counts].map(([company,workIds])=>[company,workIds.size]));
}

export function filterCatalogue(data, filters={}) {
  const query=normalize(filters.query);
  const versionByWork=new Map(data.works.map(work=>[work.id, []]));
  for(const version of data.versions) versionByWork.get(version.workId)?.push(version);
  const results=[];
  for(const work of data.works) {
    if(filters.category && work.category!==filters.category) continue;
    if(filters.subcategory && work.subcategory!==filters.subcategory) continue;
    const ownMatch=!query || normalize([work.title,work.chineseTitle,work.originalTitle,...(work.titleAliases||[]),work.genre,work.category,work.subcategory,work.synopsis,...work.characters].join(' ')).includes(query);
    const versions=(versionByWork.get(work.id) || []).filter(v=>{
      if(filters.platform && !normalize(v.platform).includes(normalize(filters.platform))) return false;
      if(filters.from && v.year<Number(filters.from)) return false;
      if(filters.to && v.year>Number(filters.to)) return false;
      if(filters.voice && !v.voice.startsWith(filters.voice)) return false;
      if(filters.company && !(filters.company==='__unattributed__'
        ? !v.publisherCompanies?.length : v.publisherCompanies?.includes(filters.company))) return false;
      return ownMatch || normalize([v.year,v.platform,v.publisher,...(v.publisherCompanies||[]),v.kind,v.voice,v.differences].join(' ')).includes(query);
    });
    if(versions.length) results.push({work,versions});
  }
  results.sort((a,b)=>{
    const nameA=a.work.chineseTitle||a.work.title;
    const nameB=b.work.chineseTitle||b.work.title;
    if(filters.sort==='newest') return b.work.firstYear-a.work.firstYear || nameA.localeCompare(nameB,'zh');
    if(filters.sort==='title') return nameA.localeCompare(nameB,'zh');
    return a.work.firstYear-b.work.firstYear || nameA.localeCompare(nameB,'zh');
  });
  return results;
}
