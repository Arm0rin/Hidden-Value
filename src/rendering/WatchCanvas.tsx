import {useEffect, useRef, useState} from 'preact/hooks';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {profileDevice} from './DeviceProfiler';

interface Props {
  phase:string; discovered:boolean; condition:number; clueHint:string; clueCode:string; clueRotation:number; devAssetLabel:string;
  showDevAsset?:boolean; restoreActiveTool?:string; onRotate:(angle:number)=>void;
  onRestoreStroke?:(deltaMs:number)=>void; onReveal:()=>void;
}

function createDial() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f2e8d3'; ctx.fillRect(0,0,1024,1024); ctx.translate(512,512);
  ctx.strokeStyle = '#8d795b'; ctx.lineWidth = 2;
  for (const r of [450,431,315]) {ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();}
  for (let i=0;i<60;i++) {
    ctx.save(); ctx.rotate(i*Math.PI/30); ctx.lineWidth=i%5===0?5:2;
    ctx.beginPath(); ctx.moveTo(0,-430); ctx.lineTo(0,i%5===0?-402:-418); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle='#302b26'; ctx.font='54px Georgia'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'].forEach((n,i)=>{
    const a=i*Math.PI/6; ctx.fillText(n,Math.sin(a)*365,-Math.cos(a)*365);
  });
  ctx.fillStyle='#75634d'; ctx.font='24px Georgia'; ctx.fillText('HIDDEN VALUE',0,-165);
  ctx.font='18px Georgia'; ctx.fillText('MECHANICAL',0,-130);
  ctx.beginPath(); ctx.arc(0,185,80,0,Math.PI*2); ctx.stroke();
  for (let i=0;i<12;i++) {
    const a=i*Math.PI/6; ctx.beginPath(); ctx.moveTo(Math.sin(a)*64,185-Math.cos(a)*64);
    ctx.lineTo(Math.sin(a)*76,185-Math.cos(a)*76); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0,195); ctx.lineTo(26,134); ctx.stroke();
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; return texture;
}

const closeToRotation=(angle:number,target:number)=>{
  const delta=Math.atan2(Math.sin(angle-target),Math.cos(angle-target));
  return Math.abs(delta)<.48;
};

export function WatchCanvas({phase,discovered,condition,clueHint,clueCode,clueRotation,devAssetLabel,showDevAsset=false,restoreActiveTool,onRotate,onRestoreStroke,onReveal}:Props) {
  const ref=useRef<HTMLDivElement>(null); const angleRef=useRef(0);
  const phaseRef=useRef(phase); phaseRef.current=phase;
  const conditionRef=useRef(condition); conditionRef.current=condition;
  const [angle,setAngle]=useState(0);
  const [stroke,setStroke]=useState({x:50,y:50,active:false});
  const drag=useRef({active:false,x:0,y:0,angle:0,lastTime:0});
  useEffect(()=>{
    const root=ref.current; if(!root)return;
    const profile=profileDevice(); const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(34,1,.1,30); camera.position.set(0,.18,5.5);
    const renderer=new THREE.WebGLRenderer({antialias:profile.antialias,alpha:true});
    renderer.setPixelRatio(profile.pixelRatio); renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.3;
    renderer.setClearColor(0,0); root.appendChild(renderer.domElement);
    const pmrem=new THREE.PMREMGenerator(renderer); const room=new RoomEnvironment();
    const environment=pmrem.fromScene(room,.04); scene.environment=environment.texture; room.dispose(); pmrem.dispose();
    const key=new THREE.DirectionalLight('#ffe0ab',3); key.position.set(-3,4,5); scene.add(key);
    const fill=new THREE.DirectionalLight('#b3d4db',1.3); fill.position.set(4,-1,3); scene.add(fill);
    const group=new THREE.Group(); scene.add(group);
    const metal=new THREE.MeshStandardMaterial({color:'#a89678',metalness:.92,roughness:.4});
    const trim=new THREE.MeshStandardMaterial({color:'#e2c58f',metalness:.92,roughness:.23});
    const blue=new THREE.MeshStandardMaterial({color:'#162f3a',metalness:.75,roughness:.22});
    const texture=createDial(); const enamel=new THREE.MeshStandardMaterial({map:texture,roughness:.42,metalness:.08});
    const add=(geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0)=>{
      const mesh=new THREE.Mesh(geometry,material); mesh.position.set(x,y,z); group.add(mesh); return mesh;
    };
    const body=add(new THREE.CylinderGeometry(1.08,1.08,.24,80),metal); body.rotation.x=Math.PI/2;
    add(new THREE.TorusGeometry(1.04,.068,16,80),trim,0,0,.11);
    add(new THREE.TorusGeometry(.958,.022,12,80),trim,0,0,.165);
    add(new THREE.CircleGeometry(.948,80),enamel,0,0,.152);
    const back=add(new THREE.CircleGeometry(1.01,80),metal,0,0,-.125); back.rotation.y=Math.PI;
    add(new THREE.TorusGeometry(.79,.009,8,80),trim,0,0,-.13);
    add(new THREE.TorusGeometry(.84,.009,8,80),trim,0,0,-.13);
    const hand=(length:number,width:number,rotation:number,z:number)=>{
      const shape=new THREE.Shape(); shape.moveTo(0,length); shape.lineTo(width,length*.28);
      shape.lineTo(width*.55,-.13); shape.lineTo(-width*.55,-.13); shape.lineTo(-width,length*.28); shape.closePath();
      const mesh=add(new THREE.ShapeGeometry(shape),blue,0,0,z); mesh.rotation.z=rotation;
    };
    hand(.55,.039,Math.PI/3,.185); hand(.73,.026,-Math.PI/3,.19);
    add(new THREE.SphereGeometry(.048,16,12),trim,0,0,.2);
    add(new THREE.CylinderGeometry(.1,.1,.22,24),trim,0,1.12,0);
    for(let i=0;i<7;i++){
      const rib=add(new THREE.TorusGeometry(.103,.008,6,24),metal,0,1.045+i*.025,0); rib.rotation.x=Math.PI/2;
    }
    add(new THREE.TorusGeometry(.18,.032,12,40),trim,0,1.37,0);
    for(let i=0;i<26;i++){
      const t=i/25; const link=add(new THREE.TorusGeometry(.045,.012,6,12),trim,.17+t*1.13,1.37-.93*t+.16*Math.sin(t*Math.PI),-.03);
      link.scale.y=1.35; link.rotation.z=-.8; link.rotation.y=i%2?.95:-.2;
    }
    const scratches=new THREE.LineBasicMaterial({color:'#514638',transparent:true,opacity:.28});
    for(let i=0;i<48;i++){
      const a=i*2.39996,r=.18+(i%13)/13*.69,x=Math.cos(a)*r,y=Math.sin(a)*r;
      const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,y,.16),new THREE.Vector3(x+.018+i%4*.008,y+.04,.16)]);
      group.add(new THREE.Line(geometry,scratches));
    }
    const resize=()=>{
      const w=root.clientWidth||390,h=root.clientHeight||420; camera.aspect=w/h;
      camera.position.z=camera.aspect<.85?6.1:5.3; camera.updateProjectionMatrix(); renderer.setSize(w,h,false);
    };
    const observer=new ResizeObserver(resize); observer.observe(root); resize();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const worn=new THREE.Color('#81725c'), clean=new THREE.Color('#ded7c8');
    const oldDial=new THREE.Color('#c7b79d'), white=new THREE.Color('#ffffff');
    let raf=0;
    const render=(time:number)=>{
      const restored=Math.max(0,Math.min(1,(conditionRef.current-42)/49));
      metal.color.copy(worn).lerp(clean,restored); metal.roughness=.55-restored*.3;
      enamel.color.copy(oldDial).lerp(white,restored); scratches.opacity=.34*(1-restored);
      const title=phaseRef.current==='TITLE'||phaseRef.current==='BOOT';
      group.rotation.y=title?-.24+(reduced.matches?0:Math.sin(time*.0004)*.09):angleRef.current;
      group.rotation.z=title?-.16:-.06;
      group.position.y=title&&!reduced.matches?Math.sin(time*.0007)*.035:0;
      renderer.render(scene,camera); raf=requestAnimationFrame(render);
    };
    raf=requestAnimationFrame(render);
    return()=>{
      cancelAnimationFrame(raf); observer.disconnect(); const materials=new Set<THREE.Material>();
      scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){
        object.geometry.dispose(); (Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));
      }});
      materials.forEach(m=>m.dispose()); texture.dispose(); environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  },[]);
  const rotate=(next:number)=>{angleRef.current=next; setAngle(next); onRotate(next);};
  const end=()=>{drag.current.active=false; setStroke(value=>({...value,active:false}));};
  const canReveal=!discovered&&closeToRotation(angle,clueRotation);
  return <div className={phase==='RESTORE'&&restoreActiveTool?'watch-stage is-restoring':'watch-stage'} ref={ref}
    tabIndex={phase==='INSPECT'?0:undefined} role={phase==='INSPECT'?'group':undefined} aria-label={clueHint}
    onKeyDown={e=>{if(phase==='INSPECT'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault(); rotate(angleRef.current+(e.key==='ArrowRight'?.3:-.3));}}}
    onPointerDown={e=>{
      if(phase!=='INSPECT'&&phase!=='RESTORE'||phase==='RESTORE'&&!restoreActiveTool)return;
      e.currentTarget.setPointerCapture(e.pointerId); drag.current={active:true,x:e.clientX,y:e.clientY,angle:angleRef.current,lastTime:performance.now()};
    }}
    onPointerMove={e=>{
      if(!drag.current.active)return;
      if(phase==='RESTORE'){
        const bounds=e.currentTarget.getBoundingClientRect();
        setStroke({x:(e.clientX-bounds.left)/bounds.width*100,y:(e.clientY-bounds.top)/bounds.height*100,active:true});
        const now=performance.now(); const delta=Math.min(120,Math.max(0,now-drag.current.lastTime)); drag.current.lastTime=now;
        if(Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y)>3){drag.current.x=e.clientX; drag.current.y=e.clientY; onRestoreStroke?.(delta);}
      }else rotate(drag.current.angle+(e.clientX-drag.current.x)*.012);
    }} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
    {phase==='INSPECT'&&!discovered&&<div className="turn-hint" aria-hidden="true">↔</div>}
    {phase==='INSPECT'&&canReveal&&<button className="clue-hotspot" onPointerDown={e=>e.stopPropagation()} onClick={onReveal}><span>{clueCode}</span><small>{clueHint}</small></button>}
    {phase==='RESTORE'&&stroke.active&&<span className="restore-glint" style={{left:stroke.x+'%',top:stroke.y+'%'}}/>}
    {showDevAsset&&<div className="dev-asset">{devAssetLabel}</div>}
  </div>;
}
