import type {ItemDefinition} from '../../core/types';
import {pocketWatch} from './pocketWatch';
import {vintageCamera} from './vintageCamera';
import {fakeLuxuryWatch} from './fakeLuxuryWatch';

export const itemDefinitions:Record<string,ItemDefinition>={
  [pocketWatch.id]:pocketWatch,
  [vintageCamera.id]:vintageCamera,
  [fakeLuxuryWatch.id]:fakeLuxuryWatch
};

export const itemSequence=Object.values(itemDefinitions);
