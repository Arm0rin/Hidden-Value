import type {PlatformAdapter} from '../PlatformAdapter';
import {WebAdapter} from '../web/WebAdapter';
/** SDK boundary only. Add official Yandex SDK integration when this milestone is approved. */
export class YandexAdapter extends WebAdapter implements PlatformAdapter { getPlatformName(){return 'yandex';} }
