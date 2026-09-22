export type FlowPhase = 'BOOT'|'TITLE'|'WORKSHOP'|'CLIENT'|'INSPECT'|'DECISION'|'BUY'|'RESTORE'|'APPRAISE'|'SELL'|'RESULT';
export type RestorationTool = 'brush'|'polish';
export interface ClueDefinition { id:string; labelKey:string; valueKey:string; position:[number,number,number]; requiredRotation:number; valuation:{min:number;max:number}; }
export interface RestorationStepDefinition { tool:RestorationTool; targetCondition:number; strokes:number; }
export interface ItemDefinition { id:string; category:string; displayNameKey:string; purchasePrice:number; trueValue:number; startingValuation:{min:number;max:number}; clues:ClueDefinition[]; restorationSteps:RestorationStepDefinition[]; finalCondition:number; }
export interface ItemInstance { definitionId:string; discoveredClueIds:string[]; condition:number; completed:boolean; owned:boolean; bought:boolean; sold:boolean; activeTool?:RestorationTool; toolProgress:number; }
export interface GameState { version:number; saveVersion:number; phase:FlowPhase; player:{level:number;xp:number;cash:number}; workshop:{level:number}; progression:{completedItems:number;discoveredClues:string[]}; tutorial:{currentStep:string;completed:boolean}; stats:{totalProfit:number;itemsBought:number;itemsSold:number}; activeItemId:string|null; activeItem:ItemInstance|null; sessionStartedAt:number; }
export interface Valuation { trueValue:number; knownMin:number; knownMax:number; confidence:number; }
export interface RewardedResult { rewarded:boolean; }
