import * as THREE from 'three';
import {clamp} from './simulation.mjs';
import {fissureMaterials} from './fissure-material.mjs';
import {CRATER_REVEAL_END} from './fissure-transition.mjs';
const vertex='varying vec2 vUV;void main(){vUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
function fixedTextureMaterial(type){
  return new THREE.ShaderMaterial({side:THREE.FrontSide,vertexShader:vertex,
    fragmentShader:`varying vec2 vUV;void main(){vec3 color=vec3(0.);if(all(greaterThanEqual(vUV,vec2(0.)))&&all(lessThanEqual(vUV,vec2(1.)))){
      ${type==='lip'?'color=mix(vec3(0.,1./255.,0.),vec3(75./255.,155./255.,75./255.),clamp(vUV.y,0.,1.));':type==='top'?'color=vec3(vUV.y);':'vec2 p=vUV*2.-1.;float d=length(p);float c=cos(d);for(int i=0;i<6;i++)c*=c;color=vec3(d<1.?.5*c+.5*(1.-d):0.);'}
      }gl_FragColor=vec4(color,1.);}`});
}
export function retailLogo(data,{custom=null,style='retail',contours=null,preparedField=null}={}){
  const scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
  const uniforms={first0:{value:new THREE.Vector3()},first1:{value:new THREE.Vector3()},second0:{value:new THREE.Vector3()},second1:{value:new THREE.Vector3()},weight:{value:0}};
  // Decompiled from the retail g_slash_interior_xvu: gradients in v1.y,
  // then r7+(r4-r7)*c8; interpolate the resulting color across each triangle.
  const interior=new THREE.ShaderMaterial({uniforms,side:THREE.FrontSide,
    vertexShader:`uniform vec3 first0,first1,second0,second1;uniform float weight;varying vec3 vColor;
      void main(){vec3 r4=mix(first1,first0,uv.y),r7=mix(second1,second0,uv.y);vColor=mix(r7,r4,weight);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:'varying vec3 vColor;void main(){gl_FragColor=vec4(clamp(vColor,0.,1.),1.);}'});
  const fissure=style==='fissure'?fissureMaterials(contours,preparedField):null;
  const materials=[interior],trademarks=[],revealMeshes=[];
  const tmPixels=new Uint8Array(16*16*4);
  data.trademarkPixels.forEach((p,i)=>{tmPixels.set([(p>>>16)&255,(p>>>8)&255,p&255,p>>>24],i*4);});
  const tmTexture=new THREE.DataTexture(tmPixels,16,16);tmTexture.minFilter=tmTexture.magFilter=THREE.LinearFilter;tmTexture.needsUpdate=true;
  let text;
  for(const [name,a] of Object.entries(custom||data.logo)){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(a.positions.flat(),3));geometry.setIndex(a.indices);
    if(a.uv){let uv=a.uv.flat();if(name.includes('surfacetop'))uv=uv.map((v,i)=>i%2&&Math.abs(v-1)<=.01?-1:v);geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
    let material;
    if(name==='text_0')material=new THREE.MeshBasicMaterial({color:new THREE.Color(98/255,202/255,19/255),side:THREE.FrontSide,depthTest:false});
    else if(name.startsWith('tm_'))material=new THREE.MeshBasicMaterial({map:tmTexture,transparent:true,side:THREE.FrontSide,depthTest:false});
    else if(fissure)material=name.includes('interiorfloor')?fissure.floor:name.includes('interior')?fissure.interior:name.includes('lip')?fissure.lip:fissure.surface;
    else material=name.includes('interior')?interior:fixedTextureMaterial(name.includes('lip')?'lip':name.includes('top')?'top':'surface');
    const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);materials.push(material);
    if(name==='text_0'){text=mesh;mesh.rotation.x=Math.PI/2;mesh.renderOrder=2;}
    if(name.startsWith('tm_')){trademarks.push(mesh);mesh.renderOrder=1;}
    if(fissure&&name!=='text_0')revealMeshes.push(mesh);
  }
  if(fissure){group.add(fissure.crater.mesh);materials.push(fissure.crater.material);}
  return {scene,group,materials,setLighting(id){fissure?.crater.setLighting(id);},setCenter(id){fissure?.crater.setCenter(id);},update(t,c){
    fissure?.update(t);
    for(const mesh of revealMeshes)mesh.visible=t<CRATER_REVEAL_END;
    group.visible=c.renderLogo;const mag=-1+2*(t-4.7)/1.3,w1=clamp(-mag),w3=clamp(mag),w2=clamp(1-w1-w3);
    if(mag<0){uniforms.first0.value.set(.81568,1,.5921);uniforms.first1.value.copy(uniforms.first0.value);uniforms.second0.value.set(.81568,1,.5294);uniforms.second1.value.copy(uniforms.second0.value);uniforms.weight.value=w1;}
    else{uniforms.first0.value.set(.81568,1,.5294);uniforms.first1.value.copy(uniforms.first0.value);uniforms.second0.value.set(.796,.8745,.0039);uniforms.second1.value.set(.1294,.4168,.0901);uniforms.weight.value=w2;}
    text.visible=t>=6;const s=clamp((t-6)/.25),a=data.textAnimation[0],b=data.textAnimation.at(-1);text.position.set(...a.map((v,i)=>v*(1-s)+b[i]*s));
    for(const m of trademarks){m.visible=t>=6;m.material.opacity=Math.trunc(s*255)/255;}
  }};
}
