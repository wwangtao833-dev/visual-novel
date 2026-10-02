import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {filterCatalogue,publisherWorkCounts,visibleVoiceNote} from '../filter.mjs';

const data=JSON.parse(readFileSync(new URL('../data/games.json',import.meta.url),'utf8'));

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
  assert.equal(found.length,27);
  for(const [query,id] of [['妻中蜜3','g482'],['妻みぐい3','g482'],['超昂神骑爱克希尔','g486'],['母烂漫','g487'],['夫人的恢复术','g488'],['超昂闪忍遥','g490'],['胸部消失的王国','g491'],['桃色守护者','g492'],['母娘乱馆','g493'],['馋嘴龙','g494'],['どらぺこ','g494'],['魅魔姐妹','g495'],['しまいま','g495'],['贪婪的仙人掌','g496'],['双教师同居生活','g497'],['だぶる先生','g497']]){
    assert.ok(filterCatalogue(data,{query}).some(({work})=>work.id===id),query);
  }
  assert.ok(found.every(({work})=>!['纯文本指令','图文指令'].includes(work.subcategory)));
  assert.equal(visibleVoiceNote(data.versions.find(v=>v.id==='g501-v1')),'无角色配音');
  assert.equal(visibleVoiceNote(data.versions.find(v=>v.id==='g501-v2')),'');
  assert.equal(visibleVoiceNote(data.versions.find(v=>v.id==='g499-v1')),'');
  for (const [query,id] of [['Atlach-Nacha','g498'],['迪亚波利卡','g499'],['海之青','g500'],['妻中蜜','g501'],['超昂天使','g502'],['妻中蜜2','g503'],['雪尔·克莱尔','g504'],['魔女的赎罪','g505'],['妻榨','g506'],['只有我的保健室','g507'],['巫女的圣域','g508']]) {
    assert.ok(filterCatalogue(data,{query,company:'Alicesoft'}).some(({work})=>work.id===id),query);
  }
  const dossier=JSON.parse(readFileSync(new URL('../data/company-coverage.json',import.meta.url),'utf8')).companies.find(c=>c.id==='alicesoft');
  assert.deepEqual(new Set(dossier.workIds),new Set(found.map(({work})=>work.id)));
});
