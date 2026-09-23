import type {ItemDefinition,ItemInstance,RestorationTool} from '../core/types';

export class RestorationSystem {
  selectTool(item:ItemInstance,tool:RestorationTool){if(item.activeTool!==tool)item.toolProgress=0;item.activeTool=tool;}
  work(def:ItemDefinition,item:ItemInstance,deltaMs:number){
    if(!item.activeTool||deltaMs<=0)return false;
    const step=def.restorationSteps.find(s=>s.tool===item.activeTool);
    if(!step)return false;
    item.toolProgress=Math.min(step.durationMs,item.toolProgress+deltaMs);
    const index=def.restorationSteps.findIndex(s=>s.tool===step.tool);
    const start=index>0?def.restorationSteps[index-1].targetCondition:item.condition;
    item.condition=Math.min(step.targetCondition,start+(step.targetCondition-start)*(item.toolProgress/step.durationMs));
    return item.toolProgress>=step.durationMs;
  }
  stroke(def:ItemDefinition,item:ItemInstance){const step=def.restorationSteps.find(s=>s.tool===item.activeTool);return this.work(def,item,step?.durationMs??0);}
  getProgress(def:ItemDefinition,item:ItemInstance,tool:RestorationTool){const step=def.restorationSteps.find(s=>s.tool===tool);return step?Math.min(1,item.activeTool===tool?item.toolProgress/step.durationMs:item.condition>=step.targetCondition?1:0):0;}
  isComplete(def:ItemDefinition,item:ItemInstance){return def.restorationSteps.every(step=>item.condition>=step.targetCondition)&&item.condition>=def.finalCondition;}
}
