// Numerical port of the 2001 VBlob and CamControl routines. Source attribution
// and the differences from the Xbox renderer are recorded in PORT.md.
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const add = (a,b) => a.map((v,i)=>v+b[i]);
export const sub = (a,b) => a.map((v,i)=>v-b[i]);
export const mul = (a,s) => a.map(v=>v*s);
export const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
export const norm = a => mul(a,1/(Math.hypot(...a)||1));
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const mix = (a,b,s) => a.map((v,i)=>v*(1-s)+b[i]*s);


// xbs_math_inl.h uses this deliberately approximate length for bump directions
// and perturbed normals; replacing it with Euclidean normalization changes motion.
export function quickNorm(a){
  const [l,m,h]=a.map(Math.abs).sort((x,y)=>x-y);
  const length=1.043388475*(h+.34375*m+.25*l);
  return length<.000001?[...a]:mul(a,1/length);
}
export function fastSin(x){
  const f=Math.fround,y=f(f(Math.abs(x))*f(2/Math.PI)),quadrant=Math.trunc(y);
  const u=(quadrant&1)?f(1-f(y-quadrant)):f(y-quadrant),u2=f(u*u);
  let p=f(f(u2*f(-.00468175413106023168))+f(.07969262624561800806));
  p=f(f(p*u2)+f(-.64596409750621907082));
  p=f(f(p*u2)+f(1.5707963267948963959));
  return f(p*u)*((x<0)!==Boolean(quadrant&2)?-1:1);
}

export class QRand {
  constructor(seed=0x76543210) { this.seed=seed>>>0; }
  next() { const s=this.seed; return this.seed=(((s>>>13)|(s<<19))-(s-11))>>>0; }
  unit() { return (this.next()&0xffff)/65536; }
  signed() { return 2*this.unit()-1; }
}

export class BlobSimulation {
  constructor() { this.reset(); }
  reset() {
    this.random=new QRand(); this.time=0; this.tick=0; this.bloblets=[]; this.bumps=[];
    for(let i=0;i<32;i++) {
      const b={}; this.bumps.push(b);
      const little=i<8?{}:null;
      if(little) this.bloblets.push(little);
      this.create(b,-.3,little);
    }
    const r=new QRand();r.next(); // CameraController::Init consumes the first app random value.
    this.pulses=Array.from({length:12},(_,i)=>{
      let x=(i+1)/13+r.signed()*.03; x=1-(.5*x*x+.5*x);
      const radius=Math.max(.1,(1.2-x)**2*(r.unit()+2)*.05);
      const magnitude=(x+.5)*(r.unit()+1)*.2*(i===11?3:1);
      return {center:i===11?.6+radius:Math.max(.6+radius,x*5+.6),radius,magnitude};
    });
    this.plasmaSeed=r.next();
  }
  create(b,time,little=null) {
    const r=this.random;
    let dir=[r.signed(),r.signed(),r.signed()];
    if(dot(dir,dir)<.001) dir=[r.signed(),r.signed(),1];
    b.dir=quickNorm(dir); b.position=[0,0,0];
    const progress=Math.max(0,(time-.6)/4.1), rand=r.unit();
    b.radius=.4+.4*rand; b.magnitude=0; b.start=time+.4*r.unit();
    b.max=((1-rand)*.5+.2)*(.5+.5*progress);
    b.little=little || b.little;
    if(b.little) {
      const l=b.little;
      l.radius=(r.unit()+1)*.25*2.3*b.radius; l.dir=[...b.dir];
      l.maxDist=2.3*(5+r.signed()*2)*.6; l.start=time;
      const period=(.8+.3*r.unit())/.6;
      l.timeMul=2*Math.PI/period; l.wobble=1.2; l.velocity=0;
      b.attached=time-b.start<.4*period;
      this.updateLittle(l,time,0); this.updateBump(b,time);
    } else {
      const length=b.max*.3+r.unit()*.3;
      b.timeMul=Math.PI/length*(progress*.2+.8);
    }
  }
  updateLittle(l,time,dt) {
    l.wobble=clamp(l.wobble+l.velocity*dt,.5,2);
    if(l.velocity>0 ? (l.wobble<.95||l.wobble>1) : (l.wobble<1||l.wobble>1.05))
      l.velocity-=(l.wobble-1)*dt*1000;
    const progress=Math.max(0,(time-.6)/4.1);
    const s=fastSin(l.timeMul*(time-l.start)*1.4*(1+time/10));
    const sm=1-(1-Math.abs(s))*Math.sqrt(1-Math.abs(s));
    l.distance=l.maxDist*(s>0?sm:-sm)*progress;
    l.far=l.distance<0; l.position=mul(l.dir,l.distance);
  }
  updateBump(b,time) {
    if(b.little) {
      const l=b.little, mag=(Math.abs(l.distance)+l.radius)/2.3;
      b.magnitude=clamp(mag-1,0,2);
      if(b.attached) {
        if(b.magnitude>.8) {
          b.attached=false; b.max=b.magnitude;
          const length=.3*b.magnitude;
          b.timeMul=2*Math.PI/length; b.start=time-.25*length;
          l.wobble=clamp(b.magnitude-.5,.6,.8); l.velocity=0;
        } else {
          if((dot(b.dir,l.dir)<0)!==l.far) { b.dir=mul(b.dir,-1); b.position=[...b.dir]; }
          return;
        }
      }
      if(!b.attached && mag<.9) b.attached=true;
    }
    const phase=(time-b.start)*b.timeMul;
    if(phase>Math.PI) {
      if(!b.little) this.create(b,time);
      else b.magnitude=0;
      return;
    }
    if(phase<0) return;
    b.magnitude=b.max*fastSin(phase); b.position=[...b.dir];
  }
  seek(time) {
    time=clamp(time,0,8);
    const target=Math.floor(time*60+1e-7);
    if(target<this.tick) this.reset();
    while(this.tick<target) {
      this.tick++; const t=this.tick/60;
      // VBlob::advanceTime does not evolve the bumps before the first flash.
      if(t>=.6) {
        for(const l of this.bloblets) this.updateLittle(l,t,1/60);
        for(const b of this.bumps) this.updateBump(b,t);
      }
    }
    this.time=time;
    this.pulse=this.pulses.reduce((s,p)=>{
      const d=Math.abs(time-p.center);
      return s+(d<p.radius?p.magnitude*Math.cos(d*Math.PI*.5/p.radius):0);
    },0);
    const x=Math.max(0,(time-1.1)/4.1);
    this.intensity=.5*x*x+.5*x+this.pulse;
    this.radius=2.3*(1+1.3*Math.sqrt(this.pulse));
    return this;
  }
}

export function makeCamera(path) {
  // Source rows are time, tension, bias, position xyz, look-at xyz.
  const nodes=path.map(row=>({time:row[0]*5.2/100,pos:row.slice(3,6),look:row.slice(6,9),tension:row[1]*.01,bias:row[2]*.01}));
  const count=nodes.length, last=nodes.at(-1), prev=nodes.at(-2);
  const extrapolated=add(last.pos,mul(sub(last.pos,prev.pos),(5.2-last.time)/(last.time-prev.time)*.7));
  const length=Math.hypot(...extrapolated), dir=norm(extrapolated);
  const offset=Math.max(195,length*1.2+95);
  const y=mul(dir,-1), x=norm(cross(y,[0,0,1])), z=cross(x,y);
  const transform=p=>add(add(mul(x,p[0]),mul(y,p[1])),mul(z,p[2]));
  const Y=[95,30.548,-70.819,-150.298,-220.64,-243.021,-261.441,-287.773];
  const Z=[0,.322,1.821,2.323,-11.926,-39.973,-60.774,-90.795];
  for(let j=0;j<8;j++) nodes.push({time:5.2+.8*j/7,pos:transform([0,Y[j]-offset,Z[j]]),look:[0,0,0],tension:0,bias:0});
  nodes.forEach((n,i)=>{
    const a=nodes[Math.max(0,i-1)].pos,b=nodes[Math.min(nodes.length-1,i+1)].pos;
    n.velocity=add(mul(sub(n.pos,a),.5*(1-n.tension)*(1+n.bias)),mul(sub(b,n.pos),.5*(1-n.tension)*(1-n.bias)));
    const prevLook=nodes[Math.max(0,i-1)].look,nextLook=nodes[Math.min(nodes.length-1,i+1)].look;
    n.lookVelocity=add(mul(sub(n.look,prevLook),.5*(1-n.tension)*(1+n.bias)),mul(sub(nextLook,n.look),.5*(1-n.tension)*(1-n.bias)));
  });
  return {nodes,count,x,y,z,offset,transform,finalTarget:transform([0,-offset,25])};
}

export function sampleCamera(camera,time) {
  const {nodes,count}=camera;
  let i=0;
  while(i<nodes.length-2 && time>=nodes[i+1].time) i++;
  const a=nodes[i],b=nodes[i+1],dtc=Math.max(.001,b.time-a.time);
  const dtp=i?Math.max(.001,a.time-nodes[i-1].time):dtc;
  const u=clamp((time-a.time)/dtc),frac=3*u*u-2*u*u*u;
  const s=time>=6?1:(time-a.time)/((1-frac)*dtp+frac*dtc);
  const c=[2*s**3-3*s*s+1,s**3-2*s*s+s,s**3-s*s,-2*s**3+3*s*s];
  const pos=a.pos.map((v,j)=>c[0]*v+c[1]*a.velocity[j]+c[2]*b.velocity[j]+c[3]*b.pos[j]);
  const look=a.look.map((v,j)=>c[0]*v+c[1]*a.lookVelocity[j]+c[2]*b.lookVelocity[j]+c[3]*b.look[j]);
  const start=nodes[count+2].time,end=nodes[count+5].time;
  const blend=(1-Math.cos(clamp((time-start)/(end-start))*Math.PI))/2;
  return {position:pos,target:mix(look,camera.finalTarget,blend),renderScene:time<nodes.at(-2).time,renderLogo:time>=nodes[count-1].time};
}

// XBoxStartupApp::advanceTime warps only the camera clock, not the scene or
// VBlob clocks. Omitting this drives the camera into still-closed machinery.
export const cameraTime = t => .8*t*t/6 + .2*t*fastSin(Math.min(Math.PI/2,t*.2833));

export function sourceSlerp(a,b,t){
  let dp=dot(a,b);if(dp<0){b=mul(b,-1);dp=-dp;}
  if(Math.abs(dp-1)<=.00001)return mix(a,b,t);
  const angle=Math.acos(clamp(dp,-1,1)),denom=fastSin(angle);
  return add(mul(a,fastSin(angle*(1-t))/denom),mul(b,fastSin(angle*t)/denom));
}

export function sceneSample(t) {
  const progress=clamp((t-.85)/4.5);
  if(progress>=1) return {index:28,fraction:1};
  const sample=progress*28;
  return {index:Math.floor(sample),fraction:sample-Math.floor(sample)};
}

export function cubeSphere(subdivisions=16) {
  const positions=[],indices=[];
  for(let face=0;face<6;face++) {
    const offset=positions.length/3;
    for(let v=0;v<=subdivisions;v++) for(let u=0;u<=subdivisions;u++) {
      const a=2*u/subdivisions-1,b=2*v/subdivisions-1;
      positions.push(...norm([[-1,-a,b],[b,-1,-a],[-a,b,-1],[1,a,b],[b,1,a],[a,b,1]][face]));
    }
    for(let v=0;v<subdivisions;v++) for(let u=0;u<subdivisions;u++) {
      const a=offset+v*(subdivisions+1)+u,b=a+1,c=a+subdivisions+1,d=c+1;
      indices.push(a,b,c,b,d,c);
    }
  }
  return {positions,indices};
}

export function deformSphere(unitPositions,simulation,out=new Float32Array(unitPositions.length),normals=null) {
  for(let i=0;i<unitPositions.length;i+=3) {
    let displacement=0;
    const normal=unitPositions.slice(i,i+3);
    for(const b of simulation.bumps) {
      const delta=[unitPositions[i]-b.position[0],unitPositions[i+1]-b.position[1],unitPositions[i+2]-b.position[2]],d=dot(delta,delta);
      if(d<b.radius*b.radius) {
        const profile=d/(b.radius*b.radius)-1;
        displacement+=2.3*b.magnitude*profile**2;
        if(normals) {
          const perturb=-4*b.magnitude/(b.radius*b.radius)*profile;
          const local=quickNorm(add(unitPositions.slice(i,i+3),mul(delta,perturb)));
          for(let j=0;j<3;j++)normal[j]+=local[j];
        }
      }
    }
    const radius=simulation.radius+displacement;
    out[i]=unitPositions[i]*radius;out[i+1]=unitPositions[i+1]*radius;out[i+2]=unitPositions[i+2]*radius;
    if(normals) normals.set(norm(normal),i);
  }
  return out;
}
