import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {filterCatalogue,publisherWorkCounts,visibleVoiceNote} from '../filter.mjs';

const data=JSON.parse(readFileSync(new URL('../data/games.json',import.meta.url),'utf8'));

test('Nitroplus completion separates shipped platforms, planned releases and publisher credits',()=>{
  const reboot=filterCatalogue(data,{query:'STEINS;GATE RE:BOOT',from:'2026',company:'MAGES.'});
  assert.deepEqual(reboot.map(({work})=>work.id),['g054']);
  assert.deepEqual(new Set(reboot[0].versions.map(v=>v.platform)),new Set(['Nintendo Switch 2','Nintendo Switch','PlayStation 5','PlayStation 4']));
  assert.equal(filterCatalogue(data,{query:'RE:BOOT',from:'2026',platform:'Xbox Series'}).length,0);
  const steam=filterCatalogue(data,{query:'RE:BOOT',from:'2026',company:'Spike Chunsoft'});
  assert.deepEqual(steam.map(({work})=>work.id),['g054']);
  assert.equal(steam[0].versions.length,1);
  assert.equal(steam[0].versions[0].platform,'Windows（Steam）');
  assert.ok(data.versions.filter(v=>v.workId==='g054').every(v=>v.platform!=='PlayStation 4 / Steam'));
  assert.deepEqual(filterCatalogue(data,{query:'機神咆吼デモンベイン'}).map(({work})=>work.id),['g600']);
  assert.deepEqual(filterCatalogue(data,{query:'ROBOTICS;NOTES ELITE',company:'Spike Chunsoft'}).map(({work})=>work.id),['g619']);
  assert.ok(filterCatalogue(data,{query:'咲畑梨深'}).some(({work})=>work.id==='g618'));
  for(const id of ['g603-v1','g608-v1','g610-v1','g611-v2','g621-v1']) assert.equal(data.versions.find(v=>v.id===id).voice,'有');
  for(const id of ['g597-v1','g613-v1','g615-v1']) assert.equal(data.versions.find(v=>v.id===id).voice,'未核实');
});

test('Nitroplus dossier reuses originals and keeps remakes, aliases and actual publishers together',()=>{
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='nitroplus');
  assert.equal(dossier.workIds.length,48);
  assert.equal(new Set(dossier.workIds).size,48);
  for(const id of ['g054','g162','g163','g169']) assert.ok(dossier.workIds.includes(id));
  for(const [query,id] of [['幻灵：地狱之影','g597'],['Phantom INTEGRATION','g597'],['CHAOS;HEAD NOAH','g618'],['你与她与她之恋。','g614'],['君と彼女と彼女の恋。','g614']]){
    assert.deepEqual(filterCatalogue(data,{query}).map(({work})=>work.id),[id]);
  }
  assert.equal(data.versions.filter(v=>v.workId==='g597').length,8);
  assert.deepEqual(filterCatalogue(data,{query:'Phantom',company:'プリンセスソフト'}).map(({versions})=>versions.map(v=>v.year)),[[2003]]);
  assert.equal(filterCatalogue(data,{query:'ROBOTICS;NOTES',company:'Nitroplus'}).length,0);
  assert.equal(filterCatalogue(data,{query:'ROBOTICS;NOTES',company:'5pb.'}).length,2);
  assert.deepEqual(new Set(dossier.publisherWorkIds),new Set(filterCatalogue(data,{company:'Nitroplus'}).map(({work})=>work.id)));
  assert.equal(data.versions.find(v=>v.id==='g600-v1').voice,'有（部分）');
  assert.equal(data.versions.find(v=>v.workId==='g163'&&v.platform==='Android').publisher,'株式会社エイシス');
  assert.equal(dossier.relatedGames.length,25);
  assert.ok(!data.works.some(w=>w.originalTitle==='機神飛翔デモンベイン'));
  assert.equal(data.works.filter(w=>w.originalTitle.includes('変移空間')).length,1);
  assert.deepEqual(filterCatalogue(data,{query:'缓慢损伤：清扫者'}).map(({work})=>work.id),['g628']);
  assert.deepEqual(filterCatalogue(data,{query:'咎狗の血 True Blood'}).map(({work})=>work.id),['g622']);
  assert.equal(data.versions.filter(v=>v.workId==='g625'&&v.kind.includes('re:code')&&v.platform.includes('Steam')).length,0);
  const page=readFileSync(new URL('../nitroplus.html',import.meta.url),'utf8');
  for(const id of dossier.workIds) assert.equal(page.split(`<article class="card" id="${id}">`).length-1,1);
  const links=[...readFileSync(new URL('../index.html',import.meta.url),'utf8').matchAll(/class="secondary-link" href="[^\"]+\.html">([^<]+)<\/a>/g)];
  assert.equal(links.length,JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.length);
  assert.ok(links.every(([,name])=>name.endsWith('社')));
});

test('historical Japanese JAST and international publishers stay independent',()=>{
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='jast');
  const old=filterCatalogue(data,{company:'JAST（日本）'});
  assert.deepEqual(new Set(old.map(({work})=>work.id)),new Set(dossier.publisherWorkIds));
  assert.ok(old.every(({work})=>dossier.workIds.includes(work.id)));
  assert.equal(filterCatalogue(data,{query:'SEASON2001',company:'JAST（日本）'}).length,0);
  assert.equal(filterCatalogue(data,{query:'SEASON2001',company:'Purple software'}).length,1);
  const japanese=filterCatalogue(data,{query:'Runaway City',company:'JAST（日本）'})[0];
  const english=filterCatalogue(data,{query:'Runaway City',company:'JAST USA'})[0];
  assert.equal(japanese.work.id,english.work.id);
  assert.ok(japanese.versions.every(v=>v.publisher==='Tiare'));
  assert.ok(english.versions.every(v=>v.publisher==='JAST USA'));
  assert.ok(!old.some(({versions})=>versions.some(v=>v.publisher==='JAST')));
});

test('JAST remakes, collections and non-narrative discs preserve work identity',()=>{
  const original=filterCatalogue(data,{query:'天使们的午后：转校生'})[0];
  assert.deepEqual(filterCatalogue(data,{query:'もんもん学園'}).map(({work})=>work.id),[original.work.id]);
  assert.equal(original.versions.filter(v=>v.kind.startsWith('重制')).length,1);
  assert.equal(filterCatalogue(data,{query:'エロでん'}).length,2);
  assert.equal(data.works.filter(w=>w.originalTitle==='エロでん').length,0);
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='jast');
  assert.ok(dossier.relatedGames.some(w=>w.id==='jast-vanishing'&&w.category==='角色扮演'));
  assert.equal(filterCatalogue(data,{query:'Vanishing Point'}).length,0);
  assert.ok(dossier.entries.some(e=>e.title.includes('SpecialII')&&e.workIds.length===0));
  const page=readFileSync(new URL('../jast.html',import.meta.url),'utf8');
  for(const id of [...dossier.workIds,...dossier.relatedGames.map(w=>w.id)]) assert.equal(page.split(`<article class="card" id="${id}">`).length-1,1);
  const pride=filterCatalogue(data,{query:'梦日记：遥远的天空之下'})[0];
  assert.equal(pride.work.firstYear,2000);
  assert.equal(pride.versions[0].publisher,'pride');
  assert.equal(pride.versions[0].voice,'有');
  const upgrade=data.versions.find(v=>v.workId==='g015'&&v.kind==='语音外设对应升级版');
  assert.equal(upgrade.voice,'有（部分）');
  assert.ok(upgrade.differences.includes('另购 JAST SOUND'));
});

test('Chinese titles and alternate spellings find the same work without losing original name search',()=>{
  for(const query of ['白色相簿','白色相簿 2','白色相册','WHITE ALBUM2']){
    assert.ok(filterCatalogue(data,{query}).some(({work})=>work.id==='g039'),query);
  }
  assert.equal(data.works.find(w=>w.id==='g039').chineseTitle,'白色相簿2');
  assert.ok(filterCatalogue(data,{query:'缘之空'}).some(({work})=>work.id==='g419'));
  assert.ok(filterCatalogue(data,{query:'仓野家的双胞胎'}).some(({work})=>work.id==='g410'));
});

test('version label appears only for explicitly unvoiced releases',()=>{
  for(const voice of ['有','有（部分）','有（主角部分）','未核实']){
    assert.equal(visibleVoiceNote({voice}),'');
  }
  assert.equal(visibleVoiceNote({voice:'无'}),'无角色配音');
});

test('Palette chapters, editorial Chinese names, and original spellings stay searchable',()=>{
  const chapter=filterCatalogue(data,{query:'9-nine-雪色雪花雪之痕'});
  assert.deepEqual(chapter.map(({work})=>work.id),['g438']);
  assert.ok(filterCatalogue(data,{query:'9-nine-ゆきいろゆきはなゆきのあと'}).some(({work})=>work.id==='g438'));
  const title=filterCatalogue(data,{query:'偷走我的心：月光狂想曲'})[0].work;
  assert.equal(title.chineseTitleType,'站内编辑译名');
  assert.equal(title.originalTitle,'すてぃーるMyはぁと～Rhapsody of moonlight～');
  assert.equal(publisherWorkCounts(data).get('ぱれっと'),18);
});

test('Silky’s new Chinese names preserve original search and studio credit',()=>{
  const chinese=filterCatalogue(data,{query:'姬骑士安洁莉卡',company:'Silky’s'});
  const original=filterCatalogue(data,{query:'姫騎士アンジェリカ',company:'Silky’s'});
  assert.equal(chinese.length,1);
  assert.equal(original[0].work.id,chinese[0].work.id);
  assert.equal(chinese[0].work.chineseTitleType,'站内编辑译名');
  assert.ok(chinese[0].work.characters.includes('アンジェリカ・ロートシルト'));
  assert.equal(publisherWorkCounts(data).get('Silky’s'),29);
  assert.equal(filterCatalogue(data,{query:'Premium',company:'Silky’s'}).length,0);
});

test('Silky’s audit keeps narrative games and removes command adventures',()=>{
  const ids=filterCatalogue(data,{company:'Silky’s'}).map(({work})=>work.id);
  for(const id of ['g441','g443','g446']) assert.ok(!ids.includes(id));
  for(const id of ['g464','g465','g466','g467']) assert.ok(ids.includes(id));
  assert.ok(filterCatalogue(data,{query:'羽翼翩跹'}).some(({work})=>work.id==='g447'));
  assert.ok(filterCatalogue(data,{query:'清洗四肢'}).some(({work})=>work.id==='g452'));
  const remake=filterCatalogue(data,{query:'野野村',company:'FG REMAKE'});
  assert.equal(remake.length,1);
  assert.ok(remake[0].versions.every(v=>v.year===2025));
});

test('a 1999 PlayStation query selects ToHeart port, not its 1997 Windows original',()=>{
  const result=filterCatalogue(data,{query:'ToHeart',platform:'PlayStation',from:1999,to:1999});
  assert.equal(result.length,1);
  assert.equal(result[0].work.title,'ToHeart');
  assert.deepEqual(result[0].versions.map(v=>v.year),[1999]);
  assert.equal(result[0].versions[0].voice,'有');
  const original=data.versions.find(v=>v.workId===result[0].work.id && v.year===1997);
  assert.equal(original.voice,'无');
});

test('all cross-era interactive animation versions can be filtered independently',()=>{
  const r=filterCatalogue(data,{category:'互动动画',platform:'Nintendo Switch',from:2023,to:2025});
  assert.ok(r.some(({work})=>work.title==='时间少女'));
  assert.ok(r.every(({versions})=>versions.every(v=>v.platform.includes('Nintendo Switch') && v.year>=2023)));
});

test('publisher and main character are independently searchable',()=>{
  assert.ok(filterCatalogue(data,{query:'G-MODE'}).some(({work})=>work.title.includes('鄂霍次克')));
  assert.ok(filterCatalogue(data,{query:'远坂凛'}).some(({work})=>work.title==='Fate/stay night'));
});

test('999 first edition and voiced collection keep separate years and voice states',()=>{
  const original=filterCatalogue(data,{query:'9 小时 9 人 9 扇门',platform:'Nintendo DS',from:2009,to:2009});
  assert.equal(original.length,1);
  assert.deepEqual(original[0].versions.map(v=>v.voice),['无']);
  const collection=filterCatalogue(data,{query:'9 小时 9 人 9 扇门',platform:'Steam',from:2017,to:2017});
  assert.equal(collection.length,1);
  assert.deepEqual(collection[0].versions.map(v=>v.voice),['有']);
});

test('Dōkyūsei original and console remake remain distinct',()=>{
  const original=filterCatalogue(data,{query:'同级生',platform:'PC-9800',from:1992,to:1992});
  const remake=filterCatalogue(data,{query:'同级生',platform:'Nintendo Switch',from:2024,to:2024});
  assert.equal(original[0].versions[0].voice,'无');
  assert.equal(remake[0].versions[0].voice,'有');
});

test('early Wingman versions retain their distinct PC-8801 and FM-7 years',()=>{
  const pc=filterCatalogue(data,{query:'ウイングマン',platform:'PC-8801',from:1984,to:1984});
  const fm=filterCatalogue(data,{query:'ウイングマン',platform:'FM-7',from:1985,to:1985});
  assert.equal(pc.length,1);
  assert.equal(fm.length,1);
  assert.deepEqual(pc[0].versions.map(v=>v.year),[1984]);
  assert.deepEqual(fm[0].versions.map(v=>v.year),[1985]);
});

test('an early PC work and its later console adaptation have separate dates',()=>{
  const pc=filterCatalogue(data,{query:'サラダの国のトマト姫',platform:'PC-8801',from:1984,to:1984});
  const consoleVersion=filterCatalogue(data,{query:'サラダの国のトマト姫',platform:'红白机',from:1988,to:1988});
  assert.equal(pc.length,1);
  assert.equal(consoleVersion.length,1);
  assert.equal(consoleVersion[0].versions[0].kind,'主机改编');
});

test('1970s origins and later commercial edition are separate works',()=>{
  const original=filterCatalogue(data,{query:'Zork (MIT PDP-10 original)',from:1977,to:1977});
  const commercial=filterCatalogue(data,{query:'Zork I: The Great Underground Empire',from:1980,to:1980});
  assert.equal(original.length,1);
  assert.equal(commercial.length,1);
  assert.notEqual(original[0].work.id,commercial[0].work.id);
  assert.deepEqual(original[0].versions.map(v=>v.platform),['PDP-10']);
});

test('identical Mystery House names do not merge two different games',()=>{
  const micro=filterCatalogue(data,{query:'ミステリーハウスⅠ',platform:'MZ-80B',from:1982,to:1982});
  const sierra=filterCatalogue(data,{query:'Mystery House',platform:'PC-8801',from:1983,to:1983});
  assert.equal(micro.length,1);
  assert.equal(sierra.length,1);
  assert.notEqual(micro[0].work.id,sierra[0].work.id);
});

test('Mystery House II uses dated FM-8 and FM-7 releases independently',()=>{
  const fm8=filterCatalogue(data,{query:'ミステリーハウスⅡ',platform:'FM-8',from:1982,to:1982});
  const fm7=filterCatalogue(data,{query:'ミステリーハウスⅡ',platform:'FM-7',from:1983,to:1983});
  assert.equal(fm8.length,1);
  assert.equal(fm7.length,1);
  assert.deepEqual(fm8[0].versions.map(v=>v.year),[1982]);
  assert.deepEqual(fm7[0].versions.map(v=>v.year),[1983]);
});

test('Sherlock separates its 1984 Spectrum and 1985 Commodore releases',()=>{
  const zx=filterCatalogue(data,{query:'Sherlock',platform:'ZX Spectrum',from:1984,to:1984});
  const c64=filterCatalogue(data,{query:'Sherlock',platform:'Commodore 64',from:1985,to:1985});
  assert.deepEqual(zx[0].versions.map(v=>v.year),[1984]);
  assert.deepEqual(c64[0].versions.map(v=>v.year),[1985]);
  assert.equal(filterCatalogue(data,{query:'Sherlock',platform:'Commodore 64',from:1984,to:1984}).length,0);
});

test('shared FM tape is a single version while Alice has a separate original machine',()=>{
  const dorm=filterCatalogue(data,{query:'女子寮パニック',from:1983,to:1983});
  assert.deepEqual(dorm[0].versions.map(v=>v.platform),['FM-8／FM-7']);
  const alice=filterCatalogue(data,{query:'不思議の国のアリス',platform:'PC-8001',from:1984,to:1984});
  assert.deepEqual(alice[0].versions.map(v=>v.publisher),['マイクロキャビン']);
});

test('subcategories select only works within the chosen parent class',()=>{
  const matches=filterCatalogue(data,{category:'互动动画',subcategory:'激光影碟·射击／驾驶'});
  assert.equal(matches.length,3);
  assert.ok(matches.every(({work})=>work.category==='互动动画' && work.subcategory==='激光影碟·射击／驾驶'));
  assert.equal(filterCatalogue(data,{category:'视觉小说',subcategory:'激光影碟·射击／驾驶'}).length,0);
});

test('publisher aliases group versions without replacing their original credit',()=>{
  const matches=filterCatalogue(data,{company:'Enix（艾尼克斯）'});
  assert.ok(matches.some(({work})=>work.title==='波多比亚连续杀人事件'));
  assert.ok(matches.some(({work})=>work.title==='女子宿舍危机'));
  assert.ok(matches.flatMap(({versions})=>versions).some(v=>v.publisher==='エニックス'));
  assert.ok(matches.flatMap(({versions})=>versions).some(v=>v.publisher==='艾尼克斯'));
});

test('joint publisher filtering keeps only credited versions of each work',()=>{
  const matches=filterCatalogue(data,{query:'ToHeart',company:'AQUAPLUS'});
  assert.ok(matches.length>0);
  assert.ok(matches.every(({versions})=>versions.every(v=>v.publisherCompanies.includes('AQUAPLUS'))));
  const original=filterCatalogue(data,{query:'Colossal Cave Adventure',company:'__unattributed__',from:1976,to:1977});
  assert.deepEqual(original[0].versions.map(v=>v.year),[1976,1977]);
});

test('publisher index counts unique games across platforms and credits the actual port publisher',()=>{
  const counts=publisherWorkCounts(data);
  assert.equal(counts.get('Key'),filterCatalogue(data,{company:'Key'}).length);
  assert.ok(data.versions.filter(v=>v.workId==='g148').length>1);
  assert.equal(counts.get('PROTOTYPE'),filterCatalogue(data,{company:'PROTOTYPE'}).length);
  assert.ok(counts.get('PROTOTYPE')>=1);
  assert.equal(counts.get('__unattributed__'),filterCatalogue(data,{company:'__unattributed__'}).length);
});

test('publisher aliases preserve historical credit and count games across platform releases',()=>{
  const historical=filterCatalogue(data,{query:'善人シボウデス',company:'Chunsoft'});
  assert.equal(historical.length,1);
  assert.deepEqual(historical[0].versions.map(v=>v.platform),['Nintendo 3DS','PS Vita']);
  assert.ok(historical[0].versions.every(v=>v.publisher==='CHUNSOFT'));
  assert.equal(filterCatalogue(data,{query:'善人シボウデス',company:'Spike Chunsoft'}).length,0);
  const counts=publisherWorkCounts(data);
  assert.equal(counts.get('Chunsoft'),filterCatalogue(data,{company:'Chunsoft'}).length);
  assert.equal(counts.get('Capcom'),filterCatalogue(data,{company:'Capcom'}).length);
  assert.ok(filterCatalogue(data,{company:'Capcom'}).some(({work})=>work.id==='g049'));
  assert.equal(counts.has('CAPCOM'),false);
  assert.equal(counts.has('CHUNSOFT'),false);
  assert.equal(filterCatalogue(data,{company:'Konami'}).filter(({work})=>work.originalTitle.startsWith('ときめきメモリアル')).length,4);
});

test('Silkys Plus dossier, Chinese searches and original-brand separation',()=>{
  const plus=filterCatalogue(data,{company:'Silky’s Plus'});
  assert.equal(plus.length,14);
  assert.ok(plus.every(({work})=>!['纯文本指令','图文指令'].includes(work.subcategory)));
  for(const [query,id] of [['七色轮回','g468'],['なないろリンカネーション','g468'],['寻蝶者','g473'],['魅魔星奏2','g480'],['莉露卡','g481'],["Silky's Plus",'g481']]) {
    assert.ok(filterCatalogue(data,{query}).some(({work})=>work.id===id),query);
  }
  assert.ok(filterCatalogue(data,{company:'Silky’s'}).every(({work})=>!plus.some(p=>p.work.id===work.id)));
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='silkys_plus');
  assert.deepEqual(new Set(dossier.workIds),new Set(plus.map(p=>p.work.id)));
});

test('Alicesoft batches are searchable in Chinese and retain their Japanese titles',()=>{
  const found=filterCatalogue(data,{company:'Alicesoft'});
  assert.equal(found.length,91);
  for(const [query,id] of [['妻中蜜3','g482'],['妻みぐい3','g482'],['超昂神骑爱克希尔','g486'],['母烂漫','g487'],['夫人的恢复术','g488'],['超昂闪忍遥','g490'],['胸部消失的王国','g491'],['桃色守护者','g492'],['母娘乱馆','g493'],['馋嘴龙','g494'],['どらぺこ','g494'],['魅魔姐妹','g495'],['しまいま','g495'],['贪婪的仙人掌','g496'],['双教师同居生活','g497'],['だぶる先生','g497']]){
    assert.ok(filterCatalogue(data,{query}).some(({work})=>work.id===id),query);
  }
  assert.ok(found.some(({work})=>work.subcategory==='图文指令'));
  assert.equal(visibleVoiceNote(data.versions.find(v=>v.id==='g501-v1')),'无角色配音');
  assert.equal(visibleVoiceNote(data.versions.find(v=>v.id==='g501-v2')),'');
  assert.equal(visibleVoiceNote(data.versions.find(v=>v.id==='g499-v1')),'');
  for (const [query,id] of [['Atlach-Nacha','g498'],['迪亚波利卡','g499'],['海之青','g500'],['妻中蜜','g501'],['超昂天使','g502'],['妻中蜜2','g503'],['雪尔·克莱尔','g504'],['魔女的赎罪','g505'],['妻榨','g506'],['只有我的保健室','g507'],['巫女的圣域','g508']]) {
    assert.ok(filterCatalogue(data,{query,company:'Alicesoft'}).some(({work})=>work.id===id),query);
  }
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='alicesoft');
  assert.deepEqual(new Set(dossier.publisherWorkIds),new Set(found.map(({work})=>work.id)));
  const predecessorIds = new Set(data.versions.filter(v=>v.publisherCompanies.includes('チャンピオンソフト')).map(v=>v.workId));
  assert.equal(predecessorIds.size,30);
  assert.equal(dossier.workIds.length,126);
  assert.ok([...predecessorIds].every(id=>dossier.workIds.includes(id)));
  assert.equal(dossier.workIds.length,new Set(dossier.workIds).size);
});

test('Alicesoft narrative migration has one searchable record per work and keeps old dossier links',()=>{
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='alicesoft');
  const anchors=Object.entries(dossier.legacyAnchors);
  const movedIds=new Set(anchors.map(([,id])=>id));
  const page=readFileSync(new URL('../alicesoft.html',import.meta.url),'utf8');
  assert.equal(anchors.length,88);
  assert.equal(movedIds.size,88);
  assert.equal(data.versions.filter(v=>movedIds.has(v.workId)).length,186);
  for(const [oldId,id] of anchors){
    const records=data.works.filter(w=>w.id===id);
    assert.equal(records.length,1,id);
    assert.ok(dossier.workIds.includes(id));
    assert.ok(!dossier.relatedGames.some(w=>w.id===oldId));
    assert.equal(page.split(`id="${oldId}"`).length-1,1,oldId);
    assert.equal(page.split(`<article class="card" id="${id}">`).length-1,1,id);
    const work=records[0];
    for(const query of [work.originalTitle,work.chineseTitle,...work.titleAliases]){
      assert.equal(filterCatalogue(data,{query}).filter(({work:w})=>w.id===id).length,1,query);
    }
  }
  assert.ok(!dossier.relatedGames.some(w=>w.category==='叙事／养成冒险'));
  for(const [query,subcategory] of [['Little PRINCESS','图文指令'],['Intruder','图文指令'],['守护神大人','恋爱模拟']]){
    assert.ok(filterCatalogue(data,{query,subcategory}).some(({work})=>movedIds.has(work.id)),query);
  }
});

test('OVERDRIVE separates independent stories from enhanced releases and original publishers',()=>{
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='overdrive');
  assert.equal(dossier.workIds.length,11);
  assert.equal(data.versions.filter(v=>dossier.workIds.includes(v.workId)).length,31);
  for(const [query,id] of [['超電激ストライカー','g646'],['煌煌舞台：谢幕','g643'],['Cross the Future','g648'],['Go! Go! Nippon! 2016','g647'],['OVERDRIVE EDITION','g650']]){
    assert.deepEqual(filterCatalogue(data,{query}).map(({work})=>work.id),[id]);
  }
  assert.equal(data.works.find(w=>w.id==='g650').firstYear,2001);
  assert.equal(data.versions.find(v=>v.id==='g650-v1').publisher,'GROOVER');
  assert.equal(data.versions.find(v=>v.id==='g650-v2').publisher,'OVERDRIVE');
  assert.equal(filterCatalogue(data,{query:'Go! Go! Nippon!',company:'OVERDRIVE'}).length,0);
  assert.equal(dossier.publisherWorkIds.length,10);
  assert.equal(data.versions.find(v=>v.id==='g647-v3').voice,'无');
  const page=readFileSync(new URL('../overdrive.html',import.meta.url),'utf8');
  for(const id of dossier.workIds){
    assert.equal(page.split(`<article class="card" id="${id}">`).length-1,1);
    assert.ok(!['纯文本指令','图文指令'].includes(data.works.find(w=>w.id===id).subcategory));
  }
});


test('Cocktail Soft menu games, remasters and publisher credits remain distinct',()=>{
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='cocktailsoft');
  assert.ok(dossier);
  const primo=filterCatalogue(data,{query:'Can Can Bunny Primo'});
  assert.equal(primo.length,1);
  assert.equal(primo[0].work.firstYear,1989);
  assert.ok(primo[0].versions.some(v=>v.year===1997 && v.kind==='重制'));
  assert.ok(!primo[0].versions.some(v=>v.platform==='MSX2'));
  const premiere=data.works.find(w=>w.originalTitle==='きゃんきゃんバニープルミエール');
  assert.ok(!data.versions.some(v=>v.workId===premiere.id && v.platform==='MSX2'));
  const chat=filterCatalogue(data,{query:'CHATのススメ'});
  assert.equal(chat.length,1);
  assert.equal(chat[0].work.subcategory,'图文选项／调查');
  assert.ok(chat[0].work.notes.includes('图标组合'));
  const se=filterCatalogue(data,{query:'Pia♥キャロットへようこそ!!G.O.SE'});
  assert.equal(se.length,1);
  assert.equal(se[0].work.firstYear,2006);
  assert.ok(se[0].versions.some(v=>v.year===2008 && v.kind==='增强版'));
  const pia22=filterCatalogue(data,{query:'Pia♥キャロットへようこそ!!2.2'});
  assert.equal(pia22.length,1);
  assert.equal(filterCatalogue(data,{query:'Pia♥キャロットへようこそ!!2.2',company:'Cocktail Soft'}).length,0);
  assert.deepEqual(new Set(dossier.publisherWorkIds),new Set(filterCatalogue(data,{company:'Cocktail Soft'}).map(({work})=>work.id)));
  const petit=filterCatalogue(data,{query:'ぴあきゃろPetitBox'});
  assert.equal(petit.length,1);
  assert.equal(petit[0].work.firstYear,2017);
  assert.ok(dossier.relatedGames.some(g=>g.originalTitle==='プリンセスメモリー'));
  assert.ok(!data.works.some(w=>w.originalTitle==='プリンセスメモリー・トゥルータイピング'));
  const page=readFileSync(new URL('../cocktailsoft.html',import.meta.url),'utf8');
  for(const id of dossier.workIds) assert.equal(page.split(`<article class="card" id="${id}">`).length-1,1);
});

test('Macadamia icon and action works retain platform credit and exclude typed commands',()=>{
  const coverage=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8'));
  const dossier=coverage.companies.find(c=>c.id==='macadamia');
  const macadam=filterCatalogue(data,{query:'二人爱戏'});
  assert.equal(macadam.length,1);
  for(const query of ['マカダム','Macadam - Futari Yogari']){
    assert.deepEqual(filterCatalogue(data,{query}).map(({work})=>work.id),[macadam[0].work.id]);
  }
  const parent=filterCatalogue(data,{query:'二人爱戏',company:'dB-SOFT'});
  const brand=filterCatalogue(data,{query:'二人爱戏',company:'Macadamia Soft'});
  assert.deepEqual(parent[0].versions.map(v=>v.platform),['PC-88']);
  assert.deepEqual(brand[0].versions.map(v=>v.platform),['PC-98']);
  const game177=filterCatalogue(data,{query:'１７７',company:'Macadamia Soft'});
  assert.equal(game177.length,1);
  assert.deepEqual(new Set(game177[0].versions.map(v=>v.platform)),new Set(['PC-88','PC-98','X1']));
  assert.ok(game177[0].work.genre.includes('动作'));
  assert.ok(!macadam[0].versions.some(v=>v.platform==='MZ-2500'));
  assert.ok(dossier.entries.some(e=>e.title.includes('MZ-2500')&&e.reason.includes('年份')));
  assert.ok(dossier.entries.some(e=>e.title.includes('Don Juan')&&e.workIds.length===0&&e.status.includes('排除')));
  assert.ok(!data.works.some(w=>w.originalTitle==='ドンファン'));
  assert.deepEqual(new Set(dossier.publisherWorkIds),new Set(filterCatalogue(data,{company:'Macadamia Soft'}).map(({work})=>work.id)));
  const page=readFileSync(new URL('../macadamia.html',import.meta.url),'utf8');
  for(const id of dossier.workIds) assert.equal(page.split(`<article class="card" id="${id}">`).length-1,1);
});


test('FairyTale keeps menu adventures, credited ports and separate playable volumes',()=>{
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='fairytale');
  const saori=filterCatalogue(data,{query:'沙织'})[0];
  assert.equal(saori.work.originalTitle,'沙織 -美少女達の館-');
  assert.equal(saori.work.subcategory,'图文选项／调查');
  assert.ok(saori.versions.some(v=>v.platform==='X68000'&&v.year===1991));
  assert.ok(dossier.workIds.includes('g690'));
  assert.equal(data.works.filter(w=>w.originalTitle==='きゃんきゃんバニー').length,1);
  const natural=filterCatalogue(data,{query:'ナチュラル２デュオ～桜色の季節～',company:'KADOKAWA'})[0];
  assert.equal(natural.work.originalTitle,'Natural2 -DUO-');
  assert.equal(natural.versions[0].platform,'PlayStation 2');
  assert.ok(!natural.versions.some(v=>v.publisherCompanies.includes('フェアリーテール')));
  assert.equal(data.works.filter(w=>w.originalTitle.startsWith('セーラー服美少女図鑑 其の')).length,6);
  assert.equal(data.works.filter(w=>w.originalTitle.startsWith('校内写生')).length,3);
  assert.ok(dossier.relatedGames.some(w=>w.originalTitle==='MOON GATE'&&w.category==='策略游戏'));
  assert.ok(dossier.entries.some(e=>e.title.includes('リップスティックV2')&&e.workIds.length===0&&e.reason.includes('缺少')));
  assert.ok(dossier.entries.some(e=>e.title.includes('ほっとMILK')&&e.workIds.length===1));
  assert.ok(dossier.workIds.every(id=>!['纯文本指令','图文指令'].includes(data.works.find(w=>w.id===id).subcategory)));
  const page=readFileSync(new URL('../fairytale.html',import.meta.url),'utf8');
  for(const id of dossier.workIds) assert.equal(page.split(`<article class="card" id="${id}">`).length-1,1);
});


test('GAINA remains an independent empty dossier without invented game credits',()=>{
  const coverage=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8'));
  const company=coverage.companies.find(c=>c.id==='gaina');
  assert.deepEqual(company.workIds,[]);
  assert.deepEqual(company.relatedGames,[]);
  assert.ok(company.publisherNote.includes('BENTEN Film'));
  assert.equal(filterCatalogue(data,{company:'GAINA'}).length,0);
  const page=readFileSync(new URL('../gaina.html',import.meta.url),'utf8');
  assert.ok(page.includes('暂未找到可确认'));
  assert.ok(page.includes('<strong>—</strong>'));
  assert.ok(!page.includes('class="card"'));
  assert.ok(!/undefined|NaN|Infinity/.test(page));
  assert.ok(readFileSync(new URL('../index.html',import.meta.url),'utf8').includes('href="gaina.html"'));
});
