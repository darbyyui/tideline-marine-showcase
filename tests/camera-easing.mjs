import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../three.module.js';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function cameraEase('),source.indexOf('function cameraOrbitTransition('));
const {cameraEase,blendCameraFlight,boatFlightEase,boatFlightDuration,boatFlightTiming}=new Function(code+';return {cameraEase,blendCameraFlight,boatFlightEase,boatFlightDuration,boatFlightTiming};')();
let previous=0;
for(let i=0;i<=1000;i++){const value=cameraEase(i/1000);assert.ok(value>=previous&&value<=1);previous=value;}
const duration=boatFlightDuration,eps=1e-5;
const p=t=>blendCameraFlight(new T.Vector3(),new T.Vector3(),new T.Vector3(10,0,0),new T.Vector3(2,0,0),t,duration).x;
assert.ok(Math.abs((p(eps)-p(0))/(eps*duration/1000)-2)<.001,'incoming velocity must be preserved');
assert.ok(Math.abs((p(1)-p(1-eps))/(eps*duration/1000))<.001,'flight must settle gently');
const step=eps*duration/1000;
assert.ok(Math.abs((p(2*eps)-2*p(eps)+p(0))/(step*step))<.02,'start acceleration must be smooth');
assert.ok(Math.abs((p(1)-2*p(1-eps)+p(1-2*eps))/(step*step))<.02,'stop acceleration must be smooth');
assert.ok(boatFlightTiming.decelerate>=800);
let previousSpeed=Infinity;
const brakingStart=1-boatFlightTiming.decelerate/boatFlightDuration;
for(let i=1;i<100;i++){
 const t=brakingStart+(1-brakingStart)*i/100;
 const speed=(p(t+eps)-p(t-eps))/(2*eps*duration/1000);
 assert.ok(speed>=-1e-5&&speed<=previousSpeed+1e-5,'final braking must continuously lose speed');previousSpeed=speed;
}
console.log('PASS: 1.1s continuous braking, matched incoming speed, smooth stop');
