import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../three.module.js';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const block=source.slice(source.indexOf('const renderMirror=ocean.onBeforeRender;'),source.indexOf('let audioContext;'));
let passes=0,mirrors=0,fail=false;
const ocean={visible:true,onBeforeRender(){mirrors++;}},render={target:'main',getRenderTarget(){return this.target;},setRenderTarget(t){this.target=t;},render(){passes++;if(fail)throw Error('test');}};
const scenePass={width:0,height:0,setSize(w,h){this.width=w;this.height=h;}},cam={position:{y:10},layers:new T.Layers(),matrixWorld:new T.Matrix4(),matrixWorldInverse:new T.Matrix4(),projectionMatrix:new T.Matrix4()};
const api=new Function('T','ocean','scenePass',`
let imported={visible:true},highQuality=true,mobileDevice=false,innerWidth=1280,innerHeight=720;
const seaUniforms={boatVisible:{},vesselEffects:{},sceneEffects:{}},projection=new T.Matrix4(),viewMatrixWater=new T.Matrix4();
${block}
return {next(){waterPassFrame++;},quality(v){highQuality=v;},visible(v){imported.visible=v;}};`)(T,ocean,scenePass);
const draw=()=>ocean.onBeforeRender(render,{},cam);
draw();draw();assert.equal(passes,1);assert.equal(mirrors,1,'same frame transmission visit must reuse reflection');
api.next();draw();assert.equal(passes,2);assert.equal(mirrors,2);
cam.matrixWorld.elements[12]=2;draw();assert.equal(mirrors,3,'different warm-up camera pose must refresh');
api.visible(false);draw();assert.equal(mirrors,4,'fade boat visibility must invalidate cached passes');
api.quality(false);draw();assert.equal(mirrors,4,'LD must skip planar reflection');assert.equal(passes,4,'LD above water must skip refraction');
cam.position.y=-1;api.next();draw();assert.equal(passes,5,'underwater LD needs refraction');
api.next();fail=true;const mask=cam.layers.mask;assert.throws(draw,/test/);assert.equal(cam.layers.mask,mask);assert.equal(ocean.visible,true);assert.equal(render.target,'main');
console.log('PASS: per-frame reuse, camera/fade invalidation, LD pass budget, underwater and error restoration');
