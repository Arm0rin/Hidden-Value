import type {ItemDefinition} from '../../core/types';
import {pocketWatch} from './pocketWatch';
import {vintageCamera} from './vintageCamera';
import {fakeLuxuryWatch} from './fakeLuxuryWatch';
import {pixelBox} from './pixelBox';
import {painting} from './painting';

export const itemDefinitions:Record<string,ItemDefinition>={
  [pocketWatch.id]:pocketWatch,
  [vintageCamera.id]:vintageCamera,
  [fakeLuxuryWatch.id]:fakeLuxuryWatch,
  [pixelBox.id]:pixelBox,
  [painting.id]:painting
};

export const itemSequence=Object.values(itemDefinitions);
