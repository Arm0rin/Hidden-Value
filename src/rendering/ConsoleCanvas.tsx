import {useEffect,useRef,useState} from 'preact/hooks';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {profileDevice} from './DeviceProfiler';

interface Props {
  phase:string; discovered:boolean; condition:number; clueHint:string; clueCode:string; clueRotation:number; devAssetLabel:string;
  showDevAsset?:boolean; restoreActiveTool?:string; onRotate:(angle:number)=>void;
  onRestoreStroke?:(deltaMs:number)=>void; onReveal:()=>void;
}

const closeToRotation=(angle:number,target:number)=>Math.abs(Math.atan2(Math.sin(angle-target),Math.cos(angle-target)))<.48;

export function ConsoleCanvas({phase,discovered,condition,clueHint,clueCode,clueRotation,devAssetLabel,showDevAsset=false,restoreActiveTool,onRotate,onRestoreStroke,onReveal}:Props){
  const ref=useRef<HTMLDivElement>(null);const angleRef=useRef(0);const phaseRef=useRef(phase);phaseRef.current=phase;const conditionRef=useRef(condition);conditionRef.current=condition;const [angle,setAngle]=useState(0);const [stroke,setStroke]=useState({x:50,y:50,active:false});const drag=useRef({active:false,x:0,y:0,angle:0,lastTime:0});
  useEffect(()=>{
    const root=ref.current;if(!root)return;const profile=profileDevice();const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(31,1,.1,30);camera.position.set(0,.05,6);
    const renderer=new THREE.WebGLRenderer({antialias:profile.antialias,alpha:true});renderer.setPixelRatio(profile.pixelRatio);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.setClearColor(0,0);root.appendChild(renderer.domElement);
    const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
    const key=new THREE.DirectionalLight('#f6d9a2',3.1);key.position.set(-3,4,5);scene.add(key);const fill=new THREE.DirectionalLight('#9dbbc1',1.4);fill.position.set(4,-1,4);scene.add(fill);
    const group=new THREE.Group();group.rotation.z=-.035;scene.add(group);const shell=new THREE.MeshStandardMaterial({color:'#5b3c2c',metalness:.45,roughness:.5});const edge=new THREE.MeshStandardMaterial({color:'#b88d55',metalness:.85,roughness:.24});const dark=new THREE.MeshStandardMaterial({color:'#191718',metalness:.25,roughness:.42});const screen=new THREE.MeshStandardMaterial({color:'#6f9d91',emissive:'#203d36',emissiveIntensity:.5,metalness:.15,roughness:.25});const button=new THREE.MeshStandardMaterial({color:'#d0a266',metalness:.76,roughness:.28});
    const add=(geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
    add(new THREE.BoxGeometry(2.5,1.42,.38),shell);add(new THREE.BoxGeometry(2.36,1.28,.06),edge,0,0,.22);add(new THREE.BoxGeometry(1.46,.78,.035),dark,0,.09,.27);add(new THREE.BoxGeometry(1.28,.6,.018),screen,0,.09,.3);
    add(new THREE.BoxGeometry(.25,.06,.055),button,-.8,-.42,.3);add(new THREE.BoxGeometry(.25,.06,.055),button,-.47,-.42,.3);
    add(new THREE.BoxGeometry(.18,.52,.065),button,.7,-.16,.31);add(new THREE.BoxGeometry(.52,.18,.065),button,.7,-.16,.31);add(new THREE.CylinderGeometry(.16,.16,.08,24),button,.7,.35,.31);
    for(const x of [-1.02,1.02])for(const y of [-.54,.54])add(new THREE.CylinderGeometry(.045,.045,.04,16),edge,x,y,.29).rotation.x=Math.PI/2;
    add(new THREE.BoxGeometry(.72,.08,.08),dark,0,.67,.25);add(new THREE.BoxGeometry(.5,.06,.03),edge,0,.67,.31);
    const rear=add(new THREE.BoxGeometry(1.6,.66,.04),dark,0,0,-.23);rear.rotation.y=Math.PI;add(new THREE.BoxGeometry(.72,.12,.03),edge,0,-.04,-.27);add(new THREE.BoxGeometry(.42,.08,.03),button,0,-.25,-.27);
    const scratches=new THREE.LineBasicMaterial({color:'#271b16',transparent:true,opacity:.3});for(let i=0;i<22;i++){const x=-1.02+(i%11)*.19,y=-.48+Math.floor(i/11)*.4;const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,y,.255),new THREE.Vector3(x+.07,y+.025,.255)]);group.add(new THREE.Line(geometry,scratches));}
    const resize=()=>{const w=root.clientWidth||390,h=root.clientHeight||420;camera.aspect=w/h;camera.position.z=camera.aspect<.85?6.8:5.8;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};const observer=new ResizeObserver(resize);observer.observe(root);resize();const reduced=matchMedia('(prefers-reduced-motion: reduce)');let raf=0;
    const render=(time:number)=>{const restored=Math.max(0,Math.min(1,(conditionRef.current-28)/66));shell.color.set('#5b3c2c').lerp(new THREE.Color('#9b7049'),restored);shell.roughness=.62-restored*.24;screen.emissiveIntensity=.35+restored*.55;scratches.opacity=.32*(1-restored);const title=phaseRef.current==='TITLE'||phaseRef.current==='BOOT';group.rotation.y=title?-.25+(reduced.matches?0:Math.sin(time*.00045)*.1):angleRef.current;group.position.y=title&&!reduced.matches?Math.sin(time*.00065)*.035:0;renderer.render(scene,camera);raf=requestAnimationFrame(render);};raf=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();const materials=new Set<THREE.Material>();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));}});materials.forEach(material=>material.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove();};
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
