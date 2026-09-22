import {render} from 'preact';
import {bootstrap} from './app/Bootstrap';
import {App} from './ui/App';
bootstrap().then(game=>render(<App game={game}/>,document.getElementById('app')!));
