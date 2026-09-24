import {it,expect,vi} from 'vitest';
import {Game} from '../src/app/Game';
import {itemSequence} from '../src/content/items';

it('returns to the workshop after refusing all sellers and starts a fresh queue',async()=>{
  const game=new Game();
  vi.spyOn(game.saveService,'save').mockResolvedValue();
  game.flow.restore('WORKSHOP');
  game.state.phase='WORKSHOP';
  await game.showClient();
  for(const definition of itemSequence){
    expect(game.state.activeItemId).toBe(definition.id);
    await game.inspect();
    await game.decideBack();
    expect(await game.refuse()).toBe(true);
  }
  expect(game.phase).toBe('WORKSHOP');
  expect(game.state.activeItem).toBeNull();
  expect(game.state.stats.itemsBought).toBe(0);
  expect(game.state.player.cash).toBe(100);
  expect(await game.showClient()).toBe(true);
  expect(game.state.activeItemId).toBe(itemSequence[0].id);
});
