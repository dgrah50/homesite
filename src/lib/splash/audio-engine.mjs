// Retail sample and SOS sequencer port. Source copyright notices and hardware
// differences are recorded in AUDIO.md. No captured boot recording is used.
import {VoiceFilter} from './audio-filter.mjs';
const signed16=x=>(x<<16)>>16;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

// SOS.C dispatches one opcode per track per 5 ms call when its timer is <0.
// Immediate commands consume calls; their negative timer debt is retained.
export function sequenceEvents(data){
  const tracks=data.tracks.map(words=>({words,pc:0,timer:0,loops:[],patch:0,volume:127,transpose:0,cutoff:0,resonance:0,pitch:0}));
  const events=[];
  for(let tick=1;tick<=Math.ceil(data.duration/data.tickSeconds);tick++){
    for(let channel=0;channel<tracks.length;channel++){
      const s=tracks[channel];s.timer=signed16(s.timer-1);if(s.timer>=0)continue;
      const op=s.words[s.pc++];let args=[];
      switch(op){
        case 0:case 13:args=[s.words[s.pc++]];s.timer=signed16(s.timer+args[0]);break;
        case 1:case 12:{const note=s.words[s.pc++],duration=s.words[s.pc++];s.pitch=((note&127)*256+s.transpose)&65535;s.timer=signed16(s.timer+duration);args=[s.pitch,duration];break;}
        case 3:s.loops.push({remaining:s.words[s.pc++],pc:s.pc});break;
        case 4:{const loop=s.loops.at(-1);if(!loop)throw new Error('Invalid SOS loop');if(--loop.remaining)s.pc=loop.pc;else s.loops.pop();break;}
        case 5:s.patch=s.words[s.pc++];s.volume=0;args=[s.patch];break;
        case 9:s.volume=(s.volume+signed16(s.words[s.pc++]))&255;args=[s.volume];break;
        case 10:s.transpose=signed16(s.transpose+s.words[s.pc++]);break;
        case 11:s.transpose=signed16(s.words[s.pc++]);break;
        case 16:s.cutoff=(s.cutoff+s.words[s.pc++])&65535;s.resonance=s.words[s.pc++];args=[s.cutoff,s.resonance];break;
        case 17:s.cutoff=s.words[s.pc++];s.resonance=s.words[s.pc++];args=[s.cutoff,s.resonance];break;
        default:throw new Error(`Unsupported SOS opcode ${op} on track ${channel}`);
      }
      if([0,1,5,9,12,16,17].includes(op))events.push({tick,channel,op,args});
    }
  }
  return events;
}

export function waveforms(data){
  const out={};
  for(const [name,bytes] of Object.entries(data.samples)){
    out[name]=Float32Array.from(bytes,b=>signed16((name==='ThunEl16'?b:b^128)<<8)/32768);
  }
  out.Sin128=Float32Array.from({length:128},(_,i)=>signed16(Math.trunc(32767*Math.sin(2*3.14159*i/128)))/32768);
  out.Saw128=Float32Array.from({length:128},(_,i)=>(i-64)/64);
  let seed=1003;
  out.Noise8192=Float32Array.from({length:8192},()=>{seed=(Math.imul(seed,214013)+2531011)>>>0;return ((seed>>>16)&32767)/32768;});
  let j=0;
  out.FM32768=Float32Array.from({length:32768},(_,i)=>{j+=i<16384?1:-1;return signed16(Math.trunc(32767*Math.sin(j/16384*Math.sin(2*2*3.14159*i/128)+4*2*3.14159*i/128)))/32768;});
  // The source reads one sample past the end for the first reverse sample.
  // This unused boot patch uses a zero sentinel for that unknown memory value.
  out.ReverseThunEl16=Float32Array.from(out.ThunEl16,(_,i)=>i?out.ThunEl16[out.ThunEl16.length-i]:0);
  return out;
}

function envelope(desc,frames){
  let f=frames-desc.delay*16;if(f<0)return 0;
  const attack=desc.attack*16;
  if(attack&&f<=attack)return Math.trunc(f*255/attack)/255;
  f-=attack;
  if(f<=desc.hold*16)return 1;
  f-=desc.hold*16;
  if(!desc.decay)return desc.sustain/255;
  const value=255*Math.pow(.99988799,f*4096/desc.decay);
  return value<=desc.sustain+.2?desc.sustain/255:Math.trunc(value)/255;
}
export function pitchRate(pitch){
  const units=((pitch>>>8)-60)*341+Math.floor((pitch&255)*341/255);
  return 2**(units/4096);
}

// Render source events to an eight-second stereo buffer. Web Audio only plays
// this buffer, so replay and resume reproduce the same sample position.
export function renderAudio(data,{effects=true}={}){
  const sampleRate=data.sampleRate,count=Math.round(data.duration*sampleRate),events=sequenceEvents(data),waves=waveforms(data);
  const left=new Float32Array(count),right=new Float32Array(count),send=new Float32Array(count);
  const voices=data.tracks.map((_,channel)=>({channel,patch:data.patches[0],wave:waves.Sin128,pos:0,active:false,age:0,
    pitch:0,volume:0,filter:new VoiceFilter(),releaseAt:null,amp:0,multi:0,rate:1}));
  let eventIndex=0,peak=0;
  for(let i=0;i<count;i++){
    while(eventIndex<events.length&&Math.round(events[eventIndex].tick*data.tickSeconds*sampleRate)<=i){
      const e=events[eventIndex++],v=voices[e.channel];
      if(e.op===5){v.patch=data.patches[e.args[0]];v.wave=waves[v.patch.waveform];v.pos=0;}
      if(e.op===9)v.volume=10**(Math.min(0,200-e.args[0]*30)/2000);
      if(e.op===16||e.op===17)v.filter.set(...e.args);
      if(e.op===0&&v.active){v.releaseAt=v.age;v.releaseAmp=v.amp;v.releaseMulti=v.multi;}
      if(e.op===1||e.op===12){
        v.pitch=e.args[0];
        if(e.op===1&&(!v.active||v.releaseAt!==null)){v.pos=0;v.age=0;v.releaseAt=null;v.active=true;}
        v.rate=pitchRate(v.pitch)*2**(v.patch.multi.pitchScale*v.multi/128);
      }
    }
    for(const v of voices){
      if(!v.active)continue;
      if(v.age%32===0){
        const frame=Math.floor(v.age/32);
        if(v.releaseAt===null){v.amp=envelope(v.patch.amplitude,frame);v.multi=envelope(v.patch.multi,frame);}
        else{
          const elapsed=(v.age-v.releaseAt)/512,a=v.patch.amplitude.release,m=v.patch.multi.release;
          v.amp=a&&elapsed<a?v.releaseAmp*Math.exp(-6.91*elapsed/a):0;
          v.multi=m&&elapsed<m?v.releaseMulti*Math.exp(-6.91*elapsed/m):0;
          if(!v.amp){v.active=false;continue;}
        }
        v.rate=pitchRate(v.pitch)*2**(v.patch.multi.pitchScale*v.multi/128);
      }
      const length=Math.min(v.wave.length,v.patch.lengthBytes/2);
      if(v.pos>=length){if(v.patch.loop)v.pos%=length;else{v.active=false;continue;}}
      const index=Math.floor(v.pos),fraction=v.pos-index,next=index+1<length?index+1:v.patch.loop?0:index;
      const sample=v.filter.process(v.wave[index]*(1-fraction)+v.wave[next]*fraction)*v.amp*v.volume;
      const special=v.channel===3||v.channel===5;
      left[i]+=sample*(special||v.channel%2===0?1:10**(-600/2000));
      right[i]+=sample*(special?10**(-100/2000):v.channel%2?1:10**(-600/2000));
      if(special)send[i]+=sample;
      v.pos+=v.rate;v.age++;
    }
  }
  // The original sends thunder and glock to FX send 0. Its DSP reverb image
  // has not been recovered. This restrained stereo delay network is explicit
  // approximation; disable it when comparing the dry voice renderer.
  if(effects){
    for(const [seconds,gain,side] of [[.031,.18,0],[.043,.18,1],[.079,.12,0],[.107,.12,1],[.163,.08,0],[.211,.08,1],[.307,.04,0],[.359,.04,1]]){
      const delay=Math.round(seconds*sampleRate),output=side?right:left;
      for(let i=delay;i<count;i++)output[i]+=send[i-delay]*gain;
    }
  }
  for(let i=0;i<count;i++){peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));left[i]=clamp(left[i],-1,1);right[i]=clamp(right[i],-1,1);}
  return {left,right,sampleRate,duration:data.duration,unclippedPeak:peak,events};
}

export function encodeWav({left,right,sampleRate}){
  const bytes=new Uint8Array(44+left.length*4),view=new DataView(bytes.buffer),text=(offset,s)=>[...s].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
  text(0,'RIFF');view.setUint32(4,bytes.length-8,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);
  view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,left.length*4,true);
  for(let i=0;i<left.length;i++){view.setInt16(44+i*4,Math.round(clamp(left[i],-1,1)*32767),true);view.setInt16(46+i*4,Math.round(clamp(right[i],-1,1)*32767),true);}
  return bytes;
}
