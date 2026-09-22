import type {ItemDefinition} from '../../core/types';

export const vintageCamera:ItemDefinition={
  id:'vintage_camera_01',
  category:'camera',
  renderType:'camera',
  displayNameKey:'item.vintageCamera.name',
  purchasePrice:55,
  trueValue:176,
  startingCondition:38,
  startingValuation:{min:30,max:95},
  finalCondition:92,
  clues:[
    {
      id:'lens_coating',
      code:'MC',
      labelKey:'clue.lens',
      valueKey:'clue.multicoated',
      position:[0,0,.12],
      requiredRotation:0,
      valuation:{min:120,max:220}
    },
    {
      id:'serial_plate',
      code:'84',
      labelKey:'clue.serial',
      valueKey:'clue.rareRun',
      position:[-.25,-.18,.12],
      requiredRotation:Math.PI,
      valuation:{min:145,max:240}
    }
  ],
  restorationSteps:[
    {tool:'brush',targetCondition:65,strokes:5},
    {tool:'polish',targetCondition:92,strokes:5}
  ]
};
