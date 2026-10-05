import * as THREE from 'three';
import {clamp} from './simulation.mjs';
import {fissureCrater} from './fissure-crater.mjs';

// Authored DG lighting. Evaluate from continuous local coordinates per pixel,
// so changing the contour's triangulation never creates gradient stripes.
export function fissureMaterials(preparedField){
  const uniforms={reveal:{value:1}};
  const vertexShader=`varying vec3 vLocal;
    void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const shader=body=>new THREE.ShaderMaterial({uniforms,side:THREE.FrontSide,vertexShader,
    fragmentShader:`uniform float reveal;varying vec3 vLocal;
      float glow(vec2 p,vec2 spread){vec2 q=p/spread;return exp(-dot(q,q));}
      void main(){${body}gl_FragColor=vec4(clamp(color,0.,1.),1.);}`});
  const cavity=`float depth=clamp((vLocal.y+127.5)/307.5,0.,1.);
    vec2 p=vLocal.xz/mix(1.,2.75,depth);
    float falloff=glow(p,vec2(58.,50.));
    float core=glow(p,vec2(6.5,10.));`;
  const interior=shader(`${cavity}
    float heat=smoothstep(0.,.18,depth);
    vec3 deep=mix(vec3(.028,.16,.015),vec3(.64,.92,.018),falloff);
    vec3 color=mix(vec3(.1,.29,.008)*(.55+.45*falloff),deep,heat);
    color=mix(color,vec3(1.,1.,.9),core*(.94+.06*heat));
    color=mix(vec3(.81568,1.,.5294),color,reveal);`);
  const floor=shader(`${cavity}
    vec3 color=mix(vec3(.028,.16,.015),vec3(.64,.92,.018),falloff);
    color=mix(color,vec3(1.,1.,.9),core);
    color=mix(vec3(.81568,1.,.5294),color,reveal);`);
  const lip=shader(`vec2 p=vLocal.xz;
    float bevel=clamp((vLocal.y+132.135)/4.635,0.,1.);
    vec3 color=mix(vec3(.001,.005,.002),vec3(.08,.23,.02),bevel)*glow(p,vec2(62.,52.));
    color+=vec3(.55,.65,.36)*glow(p,vec2(5.,9.))*bevel*.45;`);
  const surface=shader(`vec2 p=vLocal.xz;
    float hot=glow(p,vec2(4.8,13.));
    float halo=glow(p,vec2(10.,22.));
    vec3 color=vec3(1.,1.,.9)*hot*.92+vec3(.3,.34,.23)*halo*.18;`);
  const crater=fissureCrater(preparedField,uniforms);
  return {interior,floor,lip,surface,crater,update(t){uniforms.reveal.value=clamp((t-5.25)/.75);crater.update(t);}};
}
