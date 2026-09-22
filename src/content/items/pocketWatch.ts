import type { ItemDefinition } from '../../core/types';
export const pocketWatch:ItemDefinition={
 id:'pocket_watch_01',category:'antique',displayNameKey:'item.pocketWatch.name',purchasePrice:40,trueValue:118,
 startingValuation:{min:20,max:80}, finalCondition:91,
 clues:[{id:'silver_925',labelKey:'clue.stamp',valueKey:'clue.silver',position:[0.18,-0.1,0.09],requiredRotation:Math.PI,valuation:{min:70,max:150}}],
 restorationSteps:[{tool:'brush',targetCondition:68,strokes:5},{tool:'polish',targetCondition:91,strokes:4}]
};
export const itemDefinitions:Record<string,ItemDefinition>={[pocketWatch.id]:pocketWatch};
