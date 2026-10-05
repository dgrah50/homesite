export function createSplash(canvas:HTMLCanvasElement,domain:HTMLElement,options:{signal:AbortSignal}):Promise<{render(time:number):void;dispose():void}>;
export function enableSplashAudio(context:AudioContext,signal:AbortSignal):Promise<AudioBuffer>;
