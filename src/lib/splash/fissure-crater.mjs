import * as THREE from 'three';
import {LIGHTING_STUDIES} from './fissure-lighting.mjs';
import {craterBlend} from './fissure-transition.mjs';
import {CENTER_STUDIES} from './fissure-center.mjs';

import {craterField} from './crater-field.mjs';

export function fissureCrater(polygons,uniforms,preparedField=null){
  const field=preparedField||craterField(polygons),cols=257,rows=205,positions=[],uv=[],indices=[];
  if(!field.geometry)for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const u=i/(cols-1),v=j/(rows-1),h=field.heights[(j*2)*field.width+i*2];
    positions.push(-54+108*u,-132.135+h,-43+86*v);uv.push(u,v);
    if(i<cols-1&&j<rows-1){const a=j*cols+i;indices.push(a,a+1,a+cols,a+1,a+cols+1,a+cols);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(field.geometry?.positions || Float32Array.from(positions),3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(field.geometry?.uv || Float32Array.from(uv),2));geometry.setIndex(field.geometry ? new THREE.BufferAttribute(field.geometry.indices,1) : indices);
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
