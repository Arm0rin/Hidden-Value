import ru from '../locales/ru.json'; import en from '../locales/en.json';
export class LocalizationService { locale:'ru'|'en'; constructor(language:string){this.locale=language.toLowerCase().startsWith('ru')?'ru':'en';} t(key:string){return (this.locale==='ru'?ru:en)[key as keyof typeof en]??key;} toggle(){this.locale=this.locale==='ru'?'en':'ru';} }
