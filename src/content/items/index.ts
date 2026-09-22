import type {ItemDefinition} from '../../core/types';
import {pocketWatch} from './pocketWatch';
import {vintageCamera} from './vintageCamera';

export const itemDefinitions:Record<string,ItemDefinition>={
  [pocketWatch.id]:pocketWatch,
  [vintageCamera.id]:vintageCamera
};

export const itemSequence=Object.values(itemDefinitions);
