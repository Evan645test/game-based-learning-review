// Copies the files academy.html actually loads into an unlisted folder for static hosting (GitHub Pages).
// Usage (from this folder): node publish-unlisted.mjs <target-dir>
// The copy gets index.html and a noindex robots tag; nothing links to the folder, so only people with the URL find it.
// Server-only features fall back gracefully: AI hints use the offline diagnosis; textbook page links need server.py.
import fs from 'node:fs';
import path from 'node:path';

const target=process.argv[2];
if(!target)throw new Error('usage: node publish-unlisted.mjs <target-dir>');
const seen=new Set(),queue=[];
const html=fs.readFileSync('academy.html','utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#?]+)"/g))if(!/^[a-z]+:/i.test(m[1]))queue.push(m[1]);
while(queue.length){
 const file=queue.shift().replace(/^\.\//,'');
 if(seen.has(file)||!fs.existsSync(file))continue;
 seen.add(file);
 if(file.endsWith('.js')){
  const src=fs.readFileSync(file,'utf8');
  for(const m of src.matchAll(/(?:import|from)\s*\(?\s*['"](\.\/[^'"]+)['"]/g))queue.push(m[1]);
  for(const m of src.matchAll(/['"]([\w-]+\.(?:png|css|json))['"]/g))queue.push(m[1]);
 }
}
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
for(const file of seen)fs.copyFileSync(file,path.join(target,file));
const page=html.replace('<meta charset="utf-8">','<meta charset="utf-8"><meta name="robots" content="noindex,nofollow">');
if(page===html)throw new Error('academy.html has no <meta charset="utf-8"> to anchor the robots tag');
fs.writeFileSync(path.join(target,'academy.html'),page);fs.writeFileSync(path.join(target,'index.html'),page);
console.log(`copied ${seen.size} files to ${target}`);
