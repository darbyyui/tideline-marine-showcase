import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../three.module.js';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function buildHullVolume('),source.indexOf('function updateCabinProjection('));
const buildHullVolume=new Function('T',body+';return buildHullVolume;')(T);
function measure(kind,scale){
 const root=new T.Group();
 let geometry;
 if(kind==='box')geometry=new T.BoxGeometry(4,3,12);
 else{
  const outline=new T.Shape();outline.moveTo(0,6);outline.lineTo(2,1);outline.lineTo(2,-6);outline.lineTo(-2,-6);outline.lineTo(-2,1);outline.closePath();
  geometry=new T.ExtrudeGeometry(outline,{depth:3,bevelEnabled:false});geometry.rotateX(Math.PI/2);geometry.translate(0,1,0);
 }
 const model=new T.Mesh(geometry,new T.MeshBasicMaterial());
 model.name='unrecognized-imported-hull';model.scale.setScalar(scale);root.add(model);
 const volume={image:{data:new Float32Array(128*96*4)}},bounds=new T.Vector4();
 buildHullVolume(model,volume,bounds,root);
 return {bounds,data:volume.image.data};
}
for(const kind of ['box','pointed']){
 const small=measure(kind,1),large=measure(kind,4);
 small.bounds.toArray().forEach((v,i)=>assert.ok(Math.abs(large.bounds.toArray()[i]/4-v)<1e-5));
 for(let i=0;i<small.data.length;i++)assert.ok(Math.abs(large.data[i]/(i%4===2?1:4)-small.data[i])<1e-5);
 const row=Math.floor((0-small.bounds.z)/(small.bounds.w-small.bounds.z)*96);
 const width=col=>small.data[(row*128+col)*4+1]-small.data[(row*128+col)*4];
 assert.ok(width(64)>3.8,'opaque unnamed hull must be detected');
 if(kind==='pointed')assert.ok(width(125)<width(100),'bow silhouette must narrow toward tip');
}
console.log('PASS: unnamed hulls, pointed bow, and 4× scale invariance');
