// State-variable filter adapted from xemu's svf.h (GPL-2.0-only).
// Original filter: Steve Harris / andy@vellocet, SWH LADSPA Plugins.
// https://github.com/xemu-project/xemu/blob/master/hw/xbox/mcpx/apu/vp/svf.h
// See public/splash/GPL-2.0.txt. Remaining audio code uses this as a
// software approximation of MCPX filtering, not a hardware-exact DSP emulator.
export class VoiceFilter {
  constructor(){this.low=0;this.band=0;this.set(0,0);}
  set(cutoff,resonance){
    const signed=(cutoff&65535)-32768;
    // DEV.C writes cutoff+32768; interpreted as signed this is cutoff-32768.
    this.frequency=Math.max(.003906,Math.min(1,2**(signed/4096)));
    this.q=Math.max(.079407,Math.min(1,resonance/32768));
    this.scale=Math.sqrt(this.q/2+.01);
  }
  process(input){
    this.band-=this.band**3*.001;
    const high=input*this.scale-this.low-this.q*this.band;
    this.band+=this.frequency*high;
    this.low+=this.frequency*this.band;
    return Math.max(-1,Math.min(1,this.low));
  }
}
