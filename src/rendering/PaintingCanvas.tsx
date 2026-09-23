import {useEffect,useRef,useState} from 'preact/hooks';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {profileDevice} from './DeviceProfiler';

interface Props { phase:string; discovered:boolean; condition:number; clueHint:string; clueCode:string; clueRotation:number; devAssetLabel:string; showDevAsset?:boolean; restoreActiveTool?:string; onRotate:(angle:number)=>void; onRestoreStroke?:(deltaMs:number)=>void; onReveal:()=>void; }
const closeToRotation=(angle:number,target:number)=>Math.abs(Math.atan2(Math.sin(angle-target),Math.cos(angle-target)))<.48;

function createPaintingTexture(){
  const canvas=document.createElement('canvas');canvas.width=700;canvas.height=900;const ctx=canvas.getContext('2d')!;
  const wash=ctx.createLinearGradient(0,0,0,900);wash.addColorStop(0,'#9e8066');wash.addColorStop(.45,'#6b5148');wash.addColorStop(1,'#302b2d');ctx.fillStyle=wash;ctx.fillRect(0,0,700,900);
  ctx.fillStyle='#d8b681';ctx.beginPath();ctx.arc(350,300,170,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3f5361';ctx.beginPath();ctx.moveTo(90,780);ctx.quadraticCurveTo(180,520,320,650);ctx.quadraticCurveTo(480,470,620,780);ctx.fill();
  ctx.fillStyle='#ba654d';ctx.beginPath();ctx.arc(240,470,66,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e3bc77';ctx.beginPath();ctx.arc(420,520,54,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e1c69466';ctx.lineWidth=14;for(let i=0;i<22;i++){ctx.beginPath();ctx.moveTo(35+i*31,60+(i%7)*100);ctx.lineTo(120+i*25,95+(i%8)*98);ctx.stroke();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export function PaintingCanvas({phase,discovered,condition,clueHint,clueCode,clueRotation,devAssetLabel,showDevAsset=false,restoreActiveTool,onRotate,onRestoreStroke,onReveal}:Props){
  const ref=useRef<HTMLDivElement>(null);const angleRef=useRef(0);const phaseRef=useRef(phase);phaseRef.current=phase;const conditionRef=useRef(condition);conditionRef.current=condition;const [angle,setAngle]=useState(0);const [stroke,setStroke]=useState({x:50,y:50,active:false});const drag=useRef({active:false,x:0,y:0,angle:0,lastTime:0});
  useEffect(()=>{
    const root=ref.current;if(!root)return;const profile=profileDevice();const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(30,1,.1,30);camera.position.set(0,.02,6.3);const renderer=new THREE.WebGLRenderer({antialias:profile.antialias,alpha:true});renderer.setPixelRatio(profile.pixelRatio);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.setClearColor(0,0);root.appendChild(renderer.domElement);
    const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();const key=new THREE.DirectionalLight('#f8d8a3',3.3);key.position.set(-3,4,5);scene.add(key);const fill=new THREE.DirectionalLight('#a2bdc0',1.3);fill.position.set(4,-1,4);scene.add(fill);const group=new THREE.Group();group.rotation.z=-.025;scene.add(group);
    const frameMat=new THREE.MeshStandardMaterial({color:'#6e4429',metalness:.65,roughness:.3});const innerMat=new THREE.MeshStandardMaterial({color:'#c79a61',metalness:.7,roughness:.25});const backMat=new THREE.MeshStandardMaterial({color:'#29231f',metalness:.25,roughness:.6});const texture=createPaintingTexture();const artMat=new THREE.MeshStandardMaterial({map:texture,roughness:.72,metalness:.02});
    const add=(geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
    add(new THREE.BoxGeometry(2.48,3.12,.2),frameMat);add(new THREE.BoxGeometry(2.12,2.75,.055),innerMat,0,0,.12);add(new THREE.PlaneGeometry(1.9,2.52),artMat,0,0,.16);add(new THREE.BoxGeometry(2.18,2.83,.04),backMat,0,0,-.13);add(new THREE.BoxGeometry(.7,.18,.04),innerMat,0,-.78,-.17);
    for(const x of [-1.02,1.02])for(const y of [-1.29,1.29])add(new THREE.SphereGeometry(.05,16,10),innerMat,x,y,.2);
    const scratches=new THREE.LineBasicMaterial({color:'#261b15',transparent:true,opacity:.28});for(let i=0;i<18;i++){const x=-.82+(i%9)*.2,y=-1.05+Math.floor(i/9)*1.7;const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,y,.19),new THREE.Vector3(x+.08,y+.03,.19)]);group.add(new THREE.Line(geometry,scratches));}
    const resize=()=>{const w=root.clientWidth||390,h=root.clientHeight||440;camera.aspect=w/h;camera.position.z=camera.aspect<.85?7.2:6.2;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};const observer=new ResizeObserver(resize);observer.observe(root);resize();const reduced=matchMedia('(prefers-reduced-motion: reduce)');let raf=0;
    const render=(time:number)=>{const restored=Math.max(0,Math.min(1,(conditionRef.current-32)/61));frameMat.color.set('#6e4429').lerp(new THREE.Color('#b17e4f'),restored);frameMat.roughness=.45-restored*.18;artMat.roughness=.82-restored*.28;scratches.opacity=.3*(1-restored);const title=phaseRef.current==='TITLE'||phaseRef.current==='BOOT';group.rotation.y=title?-.23+(reduced.matches?0:Math.sin(time*.00042)*.08):angleRef.current;group.position.y=title&&!reduced.matches?Math.sin(time*.00065)*.035:0;renderer.render(scene,camera);raf=requestAnimationFrame(render);};raf=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();const materials=new Set<THREE.Material>();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));}});materials.forEach(material=>material.dispose());texture.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  const rotate=(next:number)=>{angleRef.current=next;setAngle(next);onRotate(next);};const end=()=>{drag.current.active=false;setStroke(value=>({...value,active:false}));};const canReveal=!discovered&&closeToRotation(angle,clueRotation);
  return <div className={phase==='RESTORE'&&restoreActiveTool?'watch-stage is-restoring':'watch-stage'} ref={ref} tabIndex={phase==='INSPECT'?0:undefined} role={phase==='INSPECT'?'group':undefined} aria-label={clueHint}
    onKeyDown={event=>{if(phase==='INSPECT'&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();rotate(angleRef.current+(event.key==='ArrowRight'?.3:-.3));}}}
    onPointerDown={event=>{if(phase!=='INSPECT'&&phase!=='RESTORE'||phase==='RESTORE'&&!restoreActiveTool)return;event.currentTarget.setPointerCapture(event.pointerId);drag.current={active:true,x:event.clientX,y:event.clientY,angle:angleRef.current,lastTime:performance.now()};}}
    onPointerMove={event=>{if(!drag.current.active)return;if(phase==='RESTORE'){const bounds=event.currentTarget.getBoundingClientRect();setStroke({x:(event.clientX-bounds.left)/bounds.width*100,y:(event.clientY-bounds.top)/bounds.height*100,active:true});const now=performance.now();const delta=Math.min(120,Math.max(0,now-drag.current.lastTime));drag.current.lastTime=now;if(Math.hypot(event.clientX-drag.current.x,event.clientY-drag.current.y)>3){drag.current.x=event.clientX;drag.current.y=event.clientY;onRestoreStroke?.(delta);}}else rotate(drag.current.angle+(event.clientX-drag.current.x)*.012);}}
    onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
    {phase==='INSPECT'&&!discovered&&<div className="turn-hint" aria-hidden="true">↔</div>}
    {phase==='INSPECT'&&canReveal&&<button className="clue-hotspot" onPointerDown={event=>event.stopPropagation()} onClick={onReveal}><span>{clueCode}</span><small>{clueHint}</small></button>}
    {phase==='RESTORE'&&stroke.active&&<span className="restore-glint" style={{left:stroke.x+'%',top:stroke.y+'%'}}/>}
    {showDevAsset&&<div className="dev-asset">{devAssetLabel}</div>}
  </div>;
}
