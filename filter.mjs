export const normalize = (value) => String(value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');

export function filterCatalogue(data, filters={}) {
  const query=normalize(filters.query);
  const versionByWork=new Map(data.works.map(work=>[work.id, []]));
  for(const version of data.versions) versionByWork.get(version.workId)?.push(version);
  const results=[];
  for(const work of data.works) {
    if(filters.category && work.category!==filters.category) continue;
    const ownMatch=!query || normalize([work.title,work.originalTitle,work.genre,work.category,work.synopsis,...work.characters].join(' ')).includes(query);
    const versions=(versionByWork.get(work.id) || []).filter(v=>{
      if(filters.platform && !normalize(v.platform).includes(normalize(filters.platform))) return false;
      if(filters.from && v.year<Number(filters.from)) return false;
      if(filters.to && v.year>Number(filters.to)) return false;
      if(filters.voice && !v.voice.startsWith(filters.voice)) return false;
      return ownMatch || normalize([v.year,v.platform,v.publisher,v.kind,v.voice,v.differences].join(' ')).includes(query);
    });
    if(versions.length) results.push({work,versions});
  }
  results.sort((a,b)=>{
    if(filters.sort==='newest') return b.work.firstYear-a.work.firstYear || a.work.title.localeCompare(b.work.title,'zh');
    if(filters.sort==='title') return a.work.title.localeCompare(b.work.title,'zh');
    return a.work.firstYear-b.work.firstYear || a.work.title.localeCompare(b.work.title,'zh');
  });
  return results;
}
