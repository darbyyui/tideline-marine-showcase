import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const block=source.slice(source.indexOf('let automaticQuality='),source.indexOf('const mobileToolbar='));
const controls=new Map();const $=id=>{if(!controls.has(id))controls.set(id,{dataset:{},setAttribute(k,v){this[k]=v;}});return controls.get(id);};
const policy=new Function('$','document',`
let highQuality=false,mobileDevice=false,devicePixelRatio=2,innerWidth=1280,innerHeight=720;
let introComplete=true,transition=null,compassDragging=false;
const orbit={autoRotate:false,addEventListener(){}},mirror={width:0,setSize(w){this.width=w;}};
const ocean={getRenderTarget:()=>mirror},renderer={ratio:1,getPixelRatio(){return this.ratio;},setDrawingBufferSize(w,h,r){this.ratio=r;}};
${block}
return {tick:adjustRenderQuality,sample:observeQualityPerformance,allowed(){return hdPerformanceAllowed;},ready(v){currentBoatReady=v;boatLoading=!v;showQuality();},moving(v){orbitHeld=v;},state(){return {high:highQuality,ratio:renderer.ratio,mirror:mirror.width,disabled:$('quality-auto').disabled};}};
`)($,{hidden:false});
policy.tick(1000);assert.equal(policy.state().high,false);assert.equal(policy.state().disabled,true);
policy.ready(true);policy.tick(1000);assert.equal(policy.state().high,true,'current vessel must unlock HD while other vessels are still preparing');assert.equal(policy.state().ratio,1.5);
policy.moving(true);policy.tick(1010);assert.equal(policy.state().high,false);assert.equal(policy.state().ratio,1.5);
policy.moving(false);policy.tick(2000);assert.equal(policy.state().high,true);
$('quality-auto').onclick();policy.tick(2100);assert.equal(policy.state().high,false);
policy.moving(true);policy.tick(2200);policy.moving(false);policy.tick(3000);assert.equal(policy.state().high,false,'manual LD must persist');
$('quality-auto').onclick();policy.tick(3100);assert.equal(policy.state().high,true);
console.log('PASS: current-vessel HD readiness, immediate interaction downgrade, idle recovery, manual LD and equal boat resolution');

for(let i=0;i<95;i++)policy.sample(5000+i*50);
assert.equal(policy.allowed(),false,'sustained slow HD frames must trigger the capability limit');
policy.tick(10000);assert.equal(policy.state().high,false);
$('quality-auto').onclick();policy.tick(10010);assert.equal(policy.state().high,true,'user can retry HD after performance fallback');
policy.moving(true);policy.tick(10020);policy.moving(false);policy.tick(10021);assert.equal(policy.state().high,true,'HD returns on the first stationary frame');
console.log('PASS: sustained HD performance detection, fallback and explicit retry');
