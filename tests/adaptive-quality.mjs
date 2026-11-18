import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const block=source.slice(source.indexOf('let automaticQuality='),source.indexOf('const mobileToolbar='));
const controls=new Map();const $=id=>{if(!controls.has(id))controls.set(id,{dataset:{},setAttribute(k,v){this[k]=v;}});return controls.get(id);};
const policy=new Function('$',`
let highQuality=false,mobileDevice=false,devicePixelRatio=2,innerWidth=1280,innerHeight=720;
let introComplete=true,transition=null,compassDragging=false;
const orbit={autoRotate:false,addEventListener(){}},mirror={width:0,setSize(w){this.width=w;}};
const ocean={getRenderTarget:()=>mirror},renderer={ratio:1,getPixelRatio(){return this.ratio;},setDrawingBufferSize(w,h,r){this.ratio=r;}};
${block}
return {tick:adjustRenderQuality,ready(v){allBoatAssetsReady=v;boatLoading=!v;showQuality();},moving(v){orbitHeld=v;},state(){return {high:highQuality,ratio:renderer.ratio,mirror:mirror.width,disabled:$('quality-auto').disabled};}};
`)($);
policy.tick(1000);assert.equal(policy.state().high,false);assert.equal(policy.state().disabled,true);
policy.ready(true);policy.tick(1000);assert.equal(policy.state().high,true);assert.equal(policy.state().ratio,1.25);
policy.moving(true);policy.tick(1010);assert.equal(policy.state().high,false);assert.equal(policy.state().ratio,.78);
policy.moving(false);policy.tick(2000);assert.equal(policy.state().high,true);
$('quality-auto').onclick();policy.tick(2100);assert.equal(policy.state().high,false);
policy.moving(true);policy.tick(2200);policy.moving(false);policy.tick(3000);assert.equal(policy.state().high,false,'manual LD must persist');
$('quality-auto').onclick();policy.tick(3100);assert.equal(policy.state().high,true);
console.log('PASS: HD load gate, interaction downgrade, idle recovery, manual LD and resolution budget');
