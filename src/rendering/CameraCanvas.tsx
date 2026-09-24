import {useEffect,useRef,useState} from 'preact/hooks';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {profileDevice} from './DeviceProfiler';

interface Props {
  phase:string; discovered:boolean; condition:number; clueHint:string; clueCode:string;
  clueRotation:number; devAssetLabel:string; showDevAsset?:boolean; restoreActiveTool?:string;
  onRotate:(angle:number)=>void; onRestoreStroke?:(deltaMs:number)=>void; onReveal:()=>void;
}

const closeToRotation=(angle:number,target:number)=>{
  const delta=Math.atan2(Math.sin(angle-target),Math.cos(angle-target));
  return Math.abs(delta)<.48;
};

export function CameraCanvas({phase,discovered,condition,clueHint,clueCode,clueRotation,devAssetLabel,showDevAsset=false,restoreActiveTool,onRotate,onRestoreStroke,onReveal}:Props){
  const ref=useRef<HTMLDivElement>(null); const angleRef=useRef(0); const phaseRef=useRef(phase); phaseRef.current=phase;
  const conditionRef=useRef(condition); conditionRef.current=condition; const [angle,setAngle]=useState(0);
  const [stroke,setStroke]=useState({x:50,y:50,active:false}); const drag=useRef({active:false,x:0,y:0,angle:0,lastTime:0});
  useEffect(()=>{
    const root=ref.current;if(!root)return;const profile=profileDevice();const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(31,1,.1,30);camera.position.set(0,.05,6);
    const renderer=new THREE.WebGLRenderer({antialias:profile.antialias,alpha:true});renderer.setPixelRatio(profile.pixelRatio);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.setClearColor(0,0);root.appendChild(renderer.domElement);
    const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);
    scene.environment=environment.texture;room.dispose();pmrem.dispose();
    const key=new THREE.DirectionalLight('#f5d7a0',3.2);key.position.set(-3,4,5);scene.add(key);
    const fill=new THREE.DirectionalLight('#9cb9c2',1.5);fill.position.set(4,-1,4);scene.add(fill);
    const group=new THREE.Group();group.rotation.z=-.045;scene.add(group);
    const bodyMat=new THREE.MeshStandardMaterial({color:'#263d3b',metalness:.65,roughness:.48});
    const leatherMat=new THREE.MeshStandardMaterial({color:'#4a2d20',metalness:.1,roughness:.72});
    const brassMat=new THREE.MeshStandardMaterial({color:'#c49a5e',metalness:.92,roughness:.22});
    const lensMat=new THREE.MeshPhysicalMaterial({color:'#91c6ce',metalness:.25,roughness:.08,transmission:.15,clearcoat:1,clearcoatRoughness:.08});
    const darkMat=new THREE.MeshStandardMaterial({color:'#11191b',metalness:.65,roughness:.3});
    const add=(geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0)=>{
      const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);group.add(mesh);return mesh;
    };
    add(new THREE.BoxGeometry(2.34,1.28,.76),bodyMat);
    add(new THREE.BoxGeometry(1.72,.88,.035),leatherMat,0,0,.4);
    add(new THREE.BoxGeometry(1.72,.88,.035),leatherMat,0,0,-.4);
    add(new THREE.BoxGeometry(.08,1.06,.05),brassMat,-1.02,0,.4);
    add(new THREE.BoxGeometry(.08,1.06,.05),brassMat,1.02,0,.4);
    const lensBase=add(new THREE.CylinderGeometry(.52,.58,.2,64),brassMat,0,0,.48);lensBase.rotation.x=Math.PI/2;
    const lensHousing=add(new THREE.CylinderGeometry(.43,.48,.16,64),darkMat,0,0,.62);lensHousing.rotation.x=Math.PI/2;
    const lens=add(new THREE.CylinderGeometry(.34,.34,.045,64),lensMat,0,0,.72);lens.rotation.x=Math.PI/2;
    add(new THREE.TorusGeometry(.5,.035,12,64),brassMat,0,0,.61);
    add(new THREE.TorusGeometry(.36,.018,10,64),brassMat,0,0,.75);
    add(new THREE.BoxGeometry(.38,.16,.14),darkMat,-.63,.73,.05);
    add(new THREE.CylinderGeometry(.1,.1,.08,24),brassMat,.66,.7,.05);
    add(new THREE.BoxGeometry(.26,.16,.2),darkMat,.62,.84,.03);
    add(new THREE.BoxGeometry(.42,.18,.16),brassMat,-.58,.76,-.02);
    add(new THREE.BoxGeometry(.5,.12,.14),darkMat,0,-.77,.02);
    add(new THREE.BoxGeometry(.46,.07,.18),brassMat,0,-.83,.04);
    // A small rear plate carries the second clue when the camera is turned over.
    add(new THREE.BoxGeometry(.62,.28,.025),brassMat,.2,-.22,-.415);
    add(new THREE.BoxGeometry(.5,.16,.012),darkMat,.2,-.22,-.435);
    const strapCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.2,.48,0),new THREE.Vector3(-1.7,.85,0),new THREE.Vector3(-1.9,-.1,0),new THREE.Vector3(-1.45,-.62,0)]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(strapCurve,32,.08,10,false),leatherMat));
    const scratches=new THREE.LineBasicMaterial({color:'#0d1b1c',transparent:true,opacity:.3});
    for(let i=0;i<30;i++){
      const x=-.78+(i%10)*.17,y=-.34+Math.floor(i/10)*.2;
      const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,y,.425),new THREE.Vector3(x+.06,y+.025,.425)]);
      group.add(new THREE.Line(geometry,scratches));
    }
    const resize=()=>{const w=root.clientWidth||390,h=root.clientHeight||420;camera.aspect=w/h;camera.position.z=camera.aspect<.85?6.8:5.8;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
    const observer=new ResizeObserver(resize);observer.observe(root);resize();const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const worn=new THREE.Color('#52605a'),clean=new THREE.Color('#b8aa87');let raf=0;
    const render=(time:number)=>{
      const restored=Math.max(0,Math.min(1,(conditionRef.current-38)/54));
      bodyMat.color.copy(worn).lerp(clean,restored);bodyMat.roughness=.58-restored*.24;leatherMat.color.set('#4a2d20').lerp(new THREE.Color('#6b4933'),restored);scratches.opacity=.35*(1-restored);
      const title=phaseRef.current==='TITLE'||phaseRef.current==='BOOT';
      group.rotation.y=title?-.32+(reduced.matches?0:Math.sin(time*.00045)*.1):angleRef.current;
      group.position.y=title&&!reduced.matches?Math.sin(time*.00065)*.035:0;renderer.render(scene,camera);raf=requestAnimationFrame(render);
    };
    raf=requestAnimationFrame(render);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();const materials=new Set<THREE.Material>();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>m.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  const rotate=(next:number)=>{angleRef.current=next;setAngle(next);onRotate(next);};const end=()=>{drag.current.active=false;setStroke(value=>({...value,active:false}));};
  const canReveal=!discovered&&closeToRotation(angle,clueRotation);
  return <div className={phase==='RESTORE'&&restoreActiveTool?'watch-stage is-restoring':'watch-stage'} ref={ref}
    tabIndex={phase==='INSPECT'?0:undefined} role={phase==='INSPECT'?'group':undefined} aria-label={clueHint}
    onKeyDown={e=>{if(phase==='INSPECT'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();rotate(angleRef.current+(e.key==='ArrowRight'?.3:-.3));}}}
    onPointerDown={e=>{if(phase!=='INSPECT'&&phase!=='RESTORE'||phase==='RESTORE'&&!restoreActiveTool)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={active:true,x:e.clientX,y:e.clientY,angle:angleRef.current,lastTime:performance.now()};}}
    onPointerMove={e=>{if(!drag.current.active)return;if(phase==='RESTORE'){const bounds=e.currentTarget.getBoundingClientRect();setStroke({x:(e.clientX-bounds.left)/bounds.width*100,y:(e.clientY-bounds.top)/bounds.height*100,active:true});const now=performance.now();const delta=Math.min(120,Math.max(0,now-drag.current.lastTime));drag.current.lastTime=now;if(Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y)>3){drag.current.x=e.clientX;drag.current.y=e.clientY;onRestoreStroke?.(delta);}}else rotate(drag.current.angle+(e.clientX-drag.current.x)*.012);}}
    onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
    {phase==='INSPECT'&&!discovered&&<div className="turn-hint" aria-hidden="true">↔</div>}
    {phase==='INSPECT'&&canReveal&&<button className="clue-hotspot" onPointerDown={e=>e.stopPropagation()} onClick={onReveal}><span>{clueCode}</span><small>{clueHint}</small></button>}
    {phase==='RESTORE'&&stroke.active&&<span className="restore-glint" style={{left:stroke.x+'%',top:stroke.y+'%'}}/>}
    {showDevAsset&&<div className="dev-asset">{devAssetLabel}</div>}
  </div>;
}
