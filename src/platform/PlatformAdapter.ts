import type {RewardedResult} from '../core/types';
export interface PlatformAdapter {init():Promise<void>;getPlatformName():string;getLanguage():string;loadSave():Promise<string|null>;save(data:string):Promise<void>;showRewarded?(placement:string):Promise<RewardedResult>;showInterstitial?(placement:string):Promise<void>;gameplayStart?():void;gameplayStop?():void;}
