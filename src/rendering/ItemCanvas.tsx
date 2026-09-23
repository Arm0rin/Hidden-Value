import type {ItemDefinition} from '../core/types';
import {WatchCanvas} from './WatchCanvas';
import {CameraCanvas} from './CameraCanvas';
import {ConsoleCanvas} from './ConsoleCanvas';

interface Props {
  definition:ItemDefinition; phase:string; discovered:boolean; condition:number;
  clueHint:string; clueCode:string; clueRotation:number; devAssetLabel:string;
  showDevAsset?:boolean; restoreActiveTool?:string; onRotate:(angle:number)=>void;
  onRestoreStroke?:(deltaMs:number)=>void; onReveal:()=>void;
}

export function ItemCanvas({definition,...props}:Props){
  if(definition.renderType==='pixelBox')return <ConsoleCanvas {...props}/>;
  if(definition.renderType==='camera')return <CameraCanvas {...props}/>;
  return <WatchCanvas {...props}/>;
}
