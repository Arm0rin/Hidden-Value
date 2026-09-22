import type {ItemDefinition,ItemInstance,Valuation} from '../core/types';
export class ValuationSystem { evaluate(def:ItemDefinition,item:ItemInstance):Valuation{const clue=def.clues.find(c=>item.discoveredClueIds.includes(c.id));const range=clue?.valuation??def.startingValuation;return {trueValue:def.trueValue,knownMin:range.min,knownMax:range.max,confidence:clue?0.82:0.32};} }
