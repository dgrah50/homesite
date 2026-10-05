import * as THREE from 'three';
import {LIGHTING_STUDIES} from './fissure-lighting.mjs';
import {craterBlend} from './fissure-transition.mjs';
import {CENTER_STUDIES} from './fissure-center.mjs';

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const distance2=(x,z,s)=>{
  const t=Math.max(0,Math.min(1,((x-s.x)*s.dx+(z-s.z)*s.dz)/s.length2));
  return (x-s.x-t*s.dx)**2+(z-s.z-t*s.dz)**2;
};

// A single rounded height field, not scaled copies of the contour. Distance to
// both the outside edge and the counter controls one continuous recessed bowl.
export function craterField(polygons,{width=513,height=409}={}){
  const bounds={x0:-54,x1:54,z0:-43,z1:43},dx=108/(width-1),dz=86/(height-1);
  const segments=polygons.flatMap(p=>p.flatMap(r=>r.slice(0,-1).flatMap(([x,z],i)=>{
    const [xx,zz]=r[i+1],length2=(xx-x)**2+(zz-z)**2;
    return length2>1e-16?[{x,z,dx:xx-x,dz:zz-z,length2}]:[];
  })));
  const cell=6,nx=Math.ceil(108/cell),nz=Math.ceil(86/cell),bins=Array.from({length:nx*nz},()=>[]);
  for(const s of segments){
    const minX=Math.max(0,Math.floor((Math.min(s.x,s.x+s.dx)+54)/cell));
    const maxX=Math.min(nx-1,Math.floor((Math.max(s.x,s.x+s.dx)+54)/cell));
    const minZ=Math.max(0,Math.floor((Math.min(s.z,s.z+s.dz)+43)/cell));
    const maxZ=Math.min(nz-1,Math.floor((Math.max(s.z,s.z+s.dz)+43)/cell));
    for(let j=minZ;j<=maxZ;j++)for(let i=minX;i<=maxX;i++)bins[j*nx+i].push(s);
  }
  const distances=new Float32Array(width*height),raw=new Float32Array(width*height);
  for(let j=0;j<height;j++){
    const z=bounds.z0+j*dz;
    const cuts=segments.flatMap(s=>((s.z<=z&&s.z+s.dz>z)||(s.z+s.dz<=z&&s.z>z))?
      [s.x+s.dx*(z-s.z)/s.dz]:[]).sort((a,b)=>a-b);
    let cut=0;
    for(let i=0;i<width;i++){
      const x=bounds.x0+i*dx,k=j*width+i;
      while(cut<cuts.length&&cuts[cut]<=x)cut++;
      const inside=cut%2===1,bx=Math.floor((x+54)/cell),bz=Math.floor((z+43)/cell),radius=inside?2:1;
      let nearest=1024;
      for(let yy=Math.max(0,bz-radius);yy<=Math.min(nz-1,bz+radius);yy++)
        for(let xx=Math.max(0,bx-radius);xx<=Math.min(nx-1,bx+radius);xx++)
          for(const s of bins[yy*nx+xx])nearest=Math.min(nearest,distance2(x,z,s));
      const d=Math.sqrt(nearest);distances[k]=inside?d:-d;
      // The narrow six-unit join needs a shallower sill at the authored oblique
      // camera angle; otherwise its front rim hides the luminous connection.
      const sill=1-.65*Math.exp(-((x/5.5)**2+(z/7)**2));
      raw[k]=inside?32*(1-Math.exp(-d*d/10.5))*sill:0;
    }
  }
  // Smooth the medial-axis ridge as well as the slopes. Keeping the boundary
  // flat preserves the exact monogram outline and black counter islands.
  const sigma=.55/dx,radius=Math.ceil(sigma*3),kernel=Array.from({length:2*radius+1},(_,i)=>Math.exp(-.5*((i-radius)/sigma)**2));
  const sum=kernel.reduce((a,b)=>a+b);for(let i=0;i<kernel.length;i++)kernel[i]/=sum;
  const temp=new Float32Array(raw.length),heights=new Float32Array(raw.length);
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
    let value=0;for(let d=-radius;d<=radius;d++)value+=raw[j*width+Math.max(0,Math.min(width-1,i+d))]*kernel[d+radius];
    temp[j*width+i]=value;
  }
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
    let value=0;for(let d=-radius;d<=radius;d++)value+=temp[Math.max(0,Math.min(height-1,j+d))*width+i]*kernel[d+radius];
    const k=j*width+i;heights[k]=value*smooth(distances[k]/.75);
  }
  const texels=new Float32Array(width*height*4);
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
    const k=j*width+i;
    texels.set([distances[k],heights[k],
      (heights[j*width+Math.min(width-1,i+1)]-heights[j*width+Math.max(0,i-1)])/(2*dx),
      (heights[Math.min(height-1,j+1)*width+i]-heights[Math.max(0,j-1)*width+i])/(2*dz)],k*4);
  }
  return {width,height,bounds,distances,heights,texels};
}

export function fissureCrater(polygons,uniforms){
  const field=craterField(polygons),cols=257,rows=205,positions=[],uv=[],indices=[];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const u=i/(cols-1),v=j/(rows-1),h=field.heights[(j*2)*field.width+i*2];
    positions.push(-54+108*u,-132.135+h,-43+86*v);uv.push(u,v);
    if(i<cols-1&&j<rows-1){const a=j*cols+i;indices.push(a,a+1,a+cols,a+1,a+cols+1,a+cols);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  const map=new THREE.DataTexture(field.texels,field.width,field.height,THREE.RGBAFormat,THREE.FloatType);
  map.minFilter=map.magFilter=THREE.LinearFilter;map.generateMipmaps=false;map.needsUpdate=true;
  const lighting={rimTint:{value:new THREE.Vector3()},floorTint:{value:new THREE.Vector3()},coreTint:{value:new THREE.Vector3()},haloTint:{value:new THREE.Vector3()},
    coreSpread:{value:new THREE.Vector2()},spillSpread:{value:new THREE.Vector2()},haloSpread:{value:new THREE.Vector2()},
    lightControls:{value:new THREE.Vector4()},spillControls:{value:new THREE.Vector2()},energyMin:{value:0},centerMode:{value:0}};
  let lightingId='soft',centerId='original';
  const applyCenter=()=>{
    const p=centerId==='original'?LIGHTING_STUDIES[lightingId]:CENTER_STUDIES[centerId];
    lighting.centerMode.value=CENTER_STUDIES[centerId].mode;
    for(const [name,key] of [['coreSpread','coreSpread'],['spillSpread','spillSpread'],['haloSpread','haloSpread']])
      lighting[name].value.set(...p[key]);
    lighting.lightControls.value.w=p.coreStrength;
    lighting.spillControls.value.set(p.spillStrength,p.haloStrength);
    lighting.coreTint.value.set(...p.core);
  };
  const setLighting=id=>{
    if(!Object.hasOwn(LIGHTING_STUDIES,id))throw new Error('Unknown fissure lighting study: '+id);
    lightingId=id;const p=LIGHTING_STUDIES[id];
    for(const [name,key] of [['rimTint','rim'],['floorTint','floor'],['haloTint','halo']])lighting[name].value.set(...p[key]);
    lighting.lightControls.value.set(p.ambient,p.heatStart,p.heatEnd,p.coreStrength);
    lighting.energyMin.value=p.energyMin;
    applyCenter();
  };
  const setCenter=id=>{
    if(!Object.hasOwn(CENTER_STUDIES,id))throw new Error('Unknown center study: '+id);
    centerId=id;applyCenter();
  };
  setLighting('soft');
  const material=new THREE.ShaderMaterial({uniforms:{...uniforms,...lighting,bowlMap:{value:map},bowlBlend:{value:0}},
    side:THREE.FrontSide,transparent:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
    vertexShader:`varying vec2 vUV;varying vec3 vLocal;
      void main(){vUV=uv;vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D bowlMap;uniform float reveal,bowlBlend,energyMin,centerMode;
      uniform vec3 rimTint,floorTint,coreTint,haloTint;uniform vec2 coreSpread,spillSpread,haloSpread,spillControls;uniform vec4 lightControls;
      varying vec2 vUV;varying vec3 vLocal;
      float glow(vec2 p,vec2 spread){vec2 q=p/spread;return exp(-dot(q,q));}
      float source(vec2 p,vec2 spread){
        if(centerMode<.5||(centerMode>1.5&&centerMode<2.5))return glow(p,spread);
        if(centerMode<1.5){
          float waist=.72+.28*exp(-p.y*p.y/36.);
          return glow(vec2(p.x/waist,p.y),spread);
        }
        if(centerMode>3.5){
          // Aim the soft arms at the authored (+/-50,+/-39) corner points.
          vec2 a=vec2(-.615032*p.x+.788502*p.y,.788502*p.x+.615032*p.y);
          vec2 b=vec2(.615032*p.x+.788502*p.y,.788502*p.x-.615032*p.y);
          float x=glow(a,spread),y=glow(b,spread);
          return x+y-x*y;
        }
        vec2 a=vec2((p.x+p.y)*.70710678,(p.y-p.x)*.70710678);
        float x=glow(a,spread),y=glow(a.yx,spread);
        return x+y-x*y;
      }
      void main(){vec4 field=texture2D(bowlMap,vUV);vec2 p=vLocal.xz;
        float cut=smoothstep(-.10,.10,field.r),depth=clamp(field.g/32.,0.,1.);
        vec3 normal=normalize(vec3(field.b,-1.,field.a));
        float form=lightControls.x+(1.-lightControls.x)*max(0.,dot(normal,normalize(vec3(-.25,-1.,.35))));
        float heat=smoothstep(lightControls.y,lightControls.z,depth);
        float energy=energyMin+(1.-energyMin)*glow(p,vec2(52.,44.));
        vec3 inside=mix(rimTint,floorTint,heat)*form*energy;
        float core=source(p,coreSpread);
        float coreDepth=(centerMode<.5||centerMode>3.5)?(.55+.45*heat):(.95+.05*heat);
        inside=mix(inside,coreTint,core*coreDepth*lightControls.w);
        inside=mix(vec3(.81568,1.,.5294),inside,reveal);
        float halo=centerMode>3.5?source(p,haloSpread):glow(p,haloSpread);
        vec3 ground=coreTint*source(p,spillSpread)*spillControls.x+haloTint*halo*spillControls.y;
        if(centerMode>3.5){
          // Spill belongs beside the cut, not across the black counter islands.
          float outside=max(0.,-field.r)/3.;
          vec3 diffuse=coreTint*glow(p,vec2(7.,16.))*spillControls.x+
            haloTint*glow(p,vec2(15.,26.))*spillControls.y;
          ground=mix(diffuse,ground*exp(-outside*outside),.16);
          ground*=smoothstep(0.,4.,min(54.-abs(p.x),43.-abs(p.y)));
        }
        vec3 color=mix(ground,inside,cut);
        float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
        color+=noise/255.*smoothstep(.003,.03,max(color.r,max(color.g,color.b)));
        gl_FragColor=vec4(clamp(color,0.,1.),bowlBlend);}`});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=1;
  return {mesh,material,field,setLighting,setCenter,update(t){
    const blend=craterBlend(t);material.uniforms.bowlBlend.value=blend;
    material.depthWrite=blend>=.999;mesh.visible=blend>0;
  }};
}
