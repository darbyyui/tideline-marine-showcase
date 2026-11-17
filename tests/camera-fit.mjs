import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../three.module.js';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function fitBoatSwitchOffset('),source.indexOf('let boatChoiceWasClosed=',source.indexOf('function fitBoatSwitchOffset(')));
for(const aspect of [16/9,9/16]){
 const imported=new T.Mesh(new T.BoxGeometry(4,16,12),new T.MeshBasicMaterial());
 const camera=new T.PerspectiveCamera(39,aspect,.15,1600),focus=new T.Vector3();
 const fit=new Function('T','camera','imported',body+';return fitBoatSwitchOffset;')(T,camera,imported);
 const distant=new T.Vector3(0,35,100),before=distant.clone();fit(focus,distant);
 assert.deepEqual(distant.toArray(),before.toArray(),'already framed boat must not zoom out');
 const near=new T.Vector3(0,3,9);fit(focus,near);
 camera.position.copy(near);camera.lookAt(focus);camera.updateMatrixWorld(true);
 for(const x of [-2,2])for(const y of [-8,8])for(const z of [-6,6]){
  const point=new T.Vector3(x,y,z).project(camera);
  assert.ok(Math.abs(point.x)<=.9&&Math.abs(point.y)<=.86&&point.z>-1&&point.z<1,'entire boat must fit');
 }
}
console.log('PASS: no zoom-out when already framed; whole boat fits in landscape and portrait');
