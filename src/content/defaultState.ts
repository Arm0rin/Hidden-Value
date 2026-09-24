import type { GameState } from '../core/types';
export const SAVE_VERSION=2;
export const createDefaultState=():GameState=>({version:1,saveVersion:SAVE_VERSION,phase:'BOOT',player:{level:1,xp:0,cash:100},workshop:{level:1},progression:{completedItems:0,completedItemIds:[],rejectedItemIds:[],discoveredClues:[]},tutorial:{currentStep:'start',completed:false},stats:{totalProfit:0,itemsBought:0,itemsSold:0,auctionAttempts:0,auctionWins:0,auctionRevenue:0,auctionHistory:[]},activeItemId:null,activeItem:null,sessionStartedAt:Date.now()});
