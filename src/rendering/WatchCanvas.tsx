import {useEffect,useRef,useState} from 'preact/hooks';
import * as THREE from 'three';
import {profileDevice} from './DeviceProfiler';
interface Props{phase:string; discovered:boolean; condition:number; clueHint:string; devAssetLabel:string; restoreActiveTool?:string; onRotate:(angle:number)=>void; onRestoreStroke?:()=>void; onReveal:()=>void;}
export function WatchCanvas({phase,discovered,condition,clueHint,devAssetLabel,restoreActiveTool,onRotate,onRestoreStroke,onReveal}:Props){const ref=useRef<HTMLDivElement>(null);const [angle,setAngle]=useState(0);const angleRef=useRef(0);const drag=useRef({active:false,x:0,y:0,angle:0});
 useEffect(()=>{if(!ref.current)return;const root=ref.current;const profile=profileDevice();const scene=new THREE.Scene();scene.background=new THREE.Color('#171513');const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(0,0,5.4);const renderer=new THREE.WebGLRenderer({antialias:profile.antialias,alpha:true});renderer.setPixelRatio(profile.pixelRatio);renderer.outputColorSpace=THREE.SRGBColorSpace;root.appendChild(renderer.domElement);const group=new THREE.Group();scene.add(group);
 const key=new THREE.DirectionalLight('#ffe1a5',3);key.position.set(2,3,4);scene.add(key);scene.add(new THREE.AmbientLight('#8e7864',1.6));
 const caseMat=new THREE.MeshStandardMaterial({color:condition>=90?'#c99e5c':condition>=65?'#8f7a5f':'#57504a',metalness:.85,roughness:condition>=90?.2:.55});const caseMesh=new THREE.Mesh(new THREE.CylinderGeometry(1.24,.98,.24,64),caseMat);caseMesh.rotation.x=Math.PI/2;group.add(caseMesh);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.08,.08,14,64),new THREE.MeshStandardMaterial({color:'#d9b677',metalness:.9,roughness:.24}));rim.rotation.x=Math.PI/2;rim.position.z=.14;group.add(rim);
 const dial=new THREE.Mesh(new THREE.CylinderGeometry(.91,.91,.035,64),new THREE.MeshStandardMaterial({color:condition>=65?'#ded8ca':'#8b8171',metalness:.15,roughness:.5}));dial.rotation.x=Math.PI/2;dial.position.z=.16;group.add(dial);
 const handMat=new THREE.MeshStandardMaterial({color:'#332a20',metalness:.4,roughness:.35});const hand1=new THREE.Mesh(new THREE.BoxGeometry(.06,.72,.025),handMat);hand1.position.y=.28;hand1.position.z=.2;group.add(hand1);const hand2=new THREE.Mesh(new THREE.BoxGeometry(.045,.48,.03),handMat);hand2.rotation.z=-.9;hand2.position.set(.2,.22,.21);group.add(hand2);
 const back=new THREE.Mesh(new THREE.CylinderGeometry(.78,.78,.02,64),new THREE.MeshStandardMaterial({color:'#6e6254',metalness:.8,roughness:.6}));back.rotation.x=Math.PI/2;back.position.z=-.15;group.add(back);
 const resize=()=>{const w=root.clientWidth||390,h=root.clientHeight||420;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};resize();const ro=new ResizeObserver(resize);ro.observe(root);let raf=0;const render=()=>{raf=requestAnimationFrame(render);group.rotation.y=angleRef.current;renderer.render(scene,camera)};render();return()=>{cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();root.removeChild(renderer.domElement);};},[condition]);
 const onPointerDown=(e:PointerEvent)=>{if(phase!=='INSPECT'&&phase!=='RESTORE')return;if(phase==='RESTORE'&&!restoreActiveTool)return;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);drag.current={active:true,x:e.clientX,y:e.clientY,angle:angleRef.current};};
 const onPointerMove=(e:PointerEvent)=>{if(!drag.current.active)return;if(phase==='RESTORE'){const distance=Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y);if(distance>24){drag.current.x=e.clientX;drag.current.y=e.clientY;onRestoreStroke?.();}return;}const next=drag.current.angle+(e.clientX-drag.current.x)*.012;angleRef.current=next;setAngle(next);onRotate(next);};
 const end=()=>{drag.current.active=false;};const canReveal=Math.abs(Math.sin(angle/2))>.88 && !discovered;
 return <div className="watch-stage" ref={ref} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end} onPointerLeave={end}>
   {phase==='INSPECT'&&<div className="turn-hint">{discovered?'':'↔'}</div>}
   {phase==='INSPECT'&&canReveal&&<button className="clue-hotspot" onPointerDown={e=>e.stopPropagation()} onClick={onReveal}><span>925</span><small>{clueHint}</small></button>}
   <div className="dev-asset">{devAssetLabel}</div>
 </div>;
}
