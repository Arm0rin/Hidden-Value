export type FlowPhase = 'BOOT'|'TITLE'|'WORKSHOP'|'CLIENT'|'INSPECT'|'DECISION'|'BUY'|'RESTORE'|'APPRAISE'|'SELL'|'RESULT';
export type RestorationTool = 'brush'|'polish';
export type ItemRenderType = 'pocketWatch'|'camera';
export interface ClueDefinition { id:string; labelKey:string; valueKey:string; code:string; position:[number,number,number]; requiredRotation:number; valuation:{min:number;max:number}; }
export interface RestorationStepDefinition { tool:RestorationTool; targetCondition:number; strokes:number; }
export interface ItemDefinition { id:string; category:string; renderType:ItemRenderType; displayNameKey:string; purchasePrice:number; trueValue:number; startingCondition:number; startingValuation:{min:number;max:number}; clues:ClueDefinition[]; restorationSteps:RestorationStepDefinition[]; finalCondition:number; }
export interface ItemInstance { definitionId:string; discoveredClueIds:string[]; condition:number; completed:boolean; owned:boolean; bought:boolean; sold:boolean; activeTool?:RestorationTool; toolProgress:number; }
export interface GameState { version:number; saveVersion:number; phase:FlowPhase; player:{level:number;xp:number;cash:number}; workshop:{level:number}; progression:{completedItems:number;completedItemIds:string[];discoveredClues:string[]}; tutorial:{currentStep:string;completed:boolean}; stats:{totalProfit:number;itemsBought:number;itemsSold:number}; activeItemId:string|null; activeItem:ItemInstance|null; sessionStartedAt:number; }
export interface Valuation { trueValue:number; knownMin:number; knownMax:number; confidence:number; }
export interface RewardedResult { rewarded:boolean; }
