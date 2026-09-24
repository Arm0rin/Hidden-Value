import {Game} from './Game';
export async function bootstrap(){const game=await new Game().init();return game;}
