import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {filterCatalogue} from '../filter.mjs';

const data=JSON.parse(readFileSync(new URL('../data/games.json',import.meta.url),'utf8'));

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
