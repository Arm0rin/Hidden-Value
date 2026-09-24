import type {PlatformAdapter} from '../PlatformAdapter';
import {WebAdapter} from '../web/WebAdapter';
/** SDK boundary only. Add official CrazyGames SDK integration when this milestone is approved. */
export class CrazyGamesAdapter extends WebAdapter implements PlatformAdapter { getPlatformName(){return 'crazygames';} }
