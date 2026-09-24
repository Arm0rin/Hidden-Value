import type { ItemDefinition } from '../../core/types';

export const fakeLuxuryWatch:ItemDefinition={
  id:'fake_luxury_watch_01',
  category:'luxury-watch',
  renderType:'pocketWatch',
  displayNameKey:'item.fakeLuxuryWatch.name',
  purchasePrice:24,
  trueValue:42,
  startingCondition:34,
  startingValuation:{min:18,max:140},
  finalCondition:90,
  clues:[
    {
      id:'uv_mark',
      code:'UV',
      labelKey:'clue.uv',
      valueKey:'clue.replica',
      position:[0,0,.12],
      requiredRotation:0,
      valuation:{min:28,max:58}
    },
    {
      id:'luxury_serial',
      code:'7A',
      labelKey:'clue.serial',
      valueKey:'clue.replica',
      position:[-.18,.12,-.12],
      requiredRotation:Math.PI,
      valuation:{min:36,max:48}
    }
  ],
  restorationSteps:[
    {tool:'brush',targetCondition:64,durationMs:7000},
    {tool:'polish',targetCondition:90,durationMs:5000}
  ]
};
