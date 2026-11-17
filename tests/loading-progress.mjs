import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=source.slice(source.indexOf('let openingProgress=0,'),source.indexOf('const status =',source.indexOf('let openingProgress=0,')));
function harness(){
 let now=0,callback=null,nextId=0;
 const history=[],nodes=new Map();
 const $=id=>{
  if(!nodes.has(id)){
   let text=id==='loading-phase'?'準備展示':'';
   nodes.set(id,{style:{},setAttribute(){},get textContent(){return text;},set textContent(value){if(id==='loading-phase'&&value!==text)history.push({at:now,text:value});text=value;}});
  }
  return nodes.get(id);
 };
 const api=new Function('$','performance','requestAnimationFrame',code+';return {showOpeningProgress,state:()=>({progress:openingProgress,target:openingTarget,ready:openingDisplayReady})};')($,{now:()=>now},fn=>{callback=fn;return ++nextId;});
 return {...api,history,advance(time){while(now<time){now=Math.min(time,now+1000/60);const fn=callback;callback=null;fn?.(now);}},get now(){return now;}};
}
const ui=harness();
for(const [value,label] of [[8,'啟動海面'],[14,'解碼船模'],[44,'載入船模與材質'],[96,'預先計算水流'],[98,'等待渲染'],[99,'場景準備完成'],[100,'載入完成']])ui.showOpeningProgress(value,label);
ui.advance(1000);assert.ok(ui.state().progress>29&&ui.state().progress<33);
ui.advance(3000);assert.equal(ui.state().ready,false);
ui.advance(4000);assert.equal(ui.state().ready,true);assert.equal(ui.state().progress,100);
let previous=0;for(const change of ui.history){assert.ok(change.at-previous>=299.9,'labels must remain readable for 300ms');previous=change.at;}
const stalled=harness();stalled.showOpeningProgress(44,'載入模型');stalled.advance(2000);assert.equal(stalled.state().progress,44,'display must not pass verified loading progress');
stalled.showOpeningProgress(100,'載入完成');stalled.advance(2050);assert.ok(stalled.state().progress<47,'new reports must not cause a jump');
console.log('PASS: evenly paced progress, 300ms label holds, completion hold and no premature progress');
