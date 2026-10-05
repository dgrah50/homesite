import * as THREE from 'three';
import {QRand,norm} from './simulation.mjs';

// Original CreateNormalizationCubeMap: 8-bit RGB, linear filtering, no mipmaps.
export function normalizationCube(size){
  const faces=[];
  for(let face=0;face<6;face++){
    const pixels=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const w=x/(size-1)*2-1,h=y/(size-1)*2-1;
      const n=norm([[1,-h,-w],[-1,-h,w],[w,1,h],[w,-1,-h],[w,-h,1],[-w,-h,-1]][face]);
      for(let j=0;j<3;j++)pixels[(y*size+x)*4+j]=Math.trunc((n[j]+1)*127.5);
      pixels[(y*size+x)*4+3]=255;
    }
    const t=new THREE.DataTexture(pixels,size,size);t.flipY=false;faces.push(t);
  }
  const cube=new THREE.CubeTexture(faces);cube.minFilter=cube.magFilter=THREE.LinearFilter;cube.generateMipmaps=false;cube.needsUpdate=true;return cube;
}

function texture(pixels,size,repeat=false){
  const t=new THREE.DataTexture(pixels,size,size);t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;
  t.wrapS=t.wrapT=repeat?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;t.needsUpdate=true;return t;
}

// Source's square/diamond traversal, including QRand's unsigned high product.
export function intensityTextures(size,num,noise,seed,plasma=false){
  const rng=new QRand(seed),rand=n=>Math.floor(rng.next()*n/4294967296);
  const arrays=Array.from({length:num},()=>new Uint8Array(size*size));
  arrays[0][0]=plasma?0:rand(255);
  let half=size>>1,x=half,y=half,step=size,n=noise>>1,square=true,second=false;
  const at=(a,x,y)=>a[((y+size)%size)*size+(x+size)%size];
  while(half>0){
    for(const a of arrays){
      let value=square?(at(a,x-half,y-half)+at(a,x+half,y-half)+at(a,x-half,y+half)+at(a,x+half,y+half))>>2:
        (at(a,x,y-half)+at(a,x,y+half)+at(a,x-half,y)+at(a,x+half,y))>>2;
      value+=plasma?rand(n*2)-n:(rand(100)>50?rand(n):-rand(n));
      a[y*size+x]=Math.max(0,Math.min(plasma?85:255,value));
    }
    x+=step;
    if(x>=size){
      y+=step;
      if(y>=size){
        if(square){x=half;y=0;square=false;continue;}
        if(second){step=half;half>>=1;n>>=1;x=y=half;square=true;}
        else{x=0;y=half;}
        second=!second;continue;
      }
      x=square?half:second?0:half;
    }
  }
  return arrays;
}

export function roughNormalTexture(){
  const size=128,a=intensityTextures(size,1,512,0)[0],pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=y*size+x,h=a[i]/512,hx=(a[i+1]??0)/512,hy=(a[i+size]??0)/512;
    const n=norm([-(hx-h)*.1,-(hy-h)*.1,.01]);
    for(let j=0;j<3;j++)pixels[i*4+j]=Math.trunc((n[j]+1)*127.5);
    pixels[i*4+3]=255;
    // Conversion happens in place in the original: subsequent left neighbors
    // are overwritten, but the forward differences read only untouched pixels.
  }
  return texture(pixels,size,true);
}

export function glowTexture(){
  const size=256,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const d=Math.max(0,16777216-((x-127)*32)**2-((y-127)*32)**2);
    // CreateGlowTexture's integer eighth-power falloff (noise=0).
    let a=Math.min(255,Math.floor(d/65536));a*=a;a*=a;a=Math.floor(a/65536);a*=a;
    const value=(Math.floor(a/65536)&0xff00)>>>8;
    pixels.fill(value,(y*size+x)*4,(y*size+x)*4+4);
  }
  return texture(pixels,size);
}

// Retail shaders sample the normalization cube in world coordinates. Bloblets
// deliberately retain the unit-sphere normal even while their vertices wobble.
function blobVertex(little){return `varying vec3 vNormal;varying vec3 vEye;void main(){
  vec4 world=modelMatrix*vec4(position,1.);vec3 eyeNormal=normalMatrix*normal;
  vNormal=${little?'normal':'normalize(vec3(dot(viewMatrix[0].xyz,eyeNormal),dot(viewMatrix[1].xyz,eyeNormal),dot(viewMatrix[2].xyz,eyeNormal)))'};
  vEye=normalize(cameraPosition-world.xyz);gl_Position=projectionMatrix*viewMatrix*world;}`;}

export function blobMaterial(cube,little=false){
  return new THREE.ShaderMaterial({uniforms:{intensity:{value:0},normalCube:{value:cube}},transparent:true,depthWrite:true,side:THREE.FrontSide,
    vertexShader:blobVertex(little),
    fragmentShader:`uniform float intensity;uniform samplerCube normalCube;varying vec3 vNormal;varying vec3 vEye;void main(){
      vec3 n=textureCube(normalCube,vNormal).rgb*2.-1.,e=textureCube(normalCube,vEye).rgb*2.-1.;
      float d=clamp(dot(n,e),0.,1.),glow=1.-(1.-d)*(1.-d);
      // NV2A combiner constants are packed ARGB colors, bounded before use.
      vec3 color=clamp(vec3(.25,1.,.15)*${little?'.3*intensity':'intensity'},0.,1.)*glow${little?'+vec3(.25,1.,.15)*.2':''};
      float alpha=${little?'clamp(.3*intensity,0.,1.)*glow':'clamp(intensity,0.,1.)'};
      gl_FragColor=vec4(clamp(color,0.,1.),alpha);}`});
}

export function sceneMaterial(kind,cubes,rough,simulation){
  const bump=kind==='Sphere'||kind==='SurfOfRev';
  const material=new THREE.ShaderMaterial({uniforms:{intensity:{value:0},lightPosition:{value:new THREE.Vector3()},
    shadowMatrix:{value:new THREE.Matrix4()},shadowMap:{value:null},
    normalCube:{value:cubes[kind==='Cylinder'||kind==='SurfOfRev'?1:0]},roughMap:{value:rough}},
    side:THREE.FrontSide,
    vertexShader:`attribute vec3 tangentS;attribute vec3 tangentT;uniform float intensity;uniform vec3 lightPosition;uniform mat4 shadowMatrix;varying vec4 vShadow;
      varying vec3 vLight;varying vec3 vHalf;varying vec2 vUV;varying float vFalloff;
      void main(){vec4 world=modelMatrix*vec4(position,1.);vShadow=shadowMatrix*world;mat3 rot=mat3(modelMatrix);rot[0]=normalize(rot[0]);rot[1]=normalize(rot[1]);rot[2]=normalize(rot[2]);
        vec3 l=lightPosition-world.xyz,e=cameraPosition-world.xyz;
        float distance=length(l);vFalloff=1./(1.+(.001*distance+.001*distance*distance)/max(intensity,.00001));
        l=normalize(l);e=normalize(e);vec3 s=rot*tangentS,t=rot*tangentT,n=rot*normal;
        vLight=vec3(dot(l,s),dot(l,t),dot(l,n));vec3 halfDir=l+e;
        vHalf=vec3(dot(halfDir,s),dot(halfDir,t),dot(halfDir,n));vUV=uv;gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`uniform float intensity;uniform samplerCube normalCube;uniform sampler2D roughMap;uniform sampler2D shadowMap;varying vec4 vShadow;
      varying vec3 vLight;varying vec3 vHalf;varying vec2 vUV;varying float vFalloff;
      void main(){vec3 n=${bump?'texture2D(roughMap,vUV).rgb*2.-1.':'vec3(0.,0.,1.)'};
        vec3 l=textureCube(normalCube,vLight).rgb*2.-1.,h=textureCube(normalCube,vHalf).rgb*2.-1.;
        float diffuse=clamp(dot(n,l),0.,1.),specular=pow(clamp(dot(n,h),0.,1.),${bump?'16.':'32.'});
        vec3 diffuseColor=clamp(vec3(.2079,1.,.1)*intensity*.13,0.,1.),specularColor=clamp(vec3(.2079,1.,.1)*intensity,0.,1.);
        vec3 color=clamp(diffuseColor*diffuse+specularColor*specular,0.,1.)*vFalloff;
        vec3 shadow=vShadow.xyz/max(.000001,vShadow.w)*.5+.5;
        if(vShadow.w>0.&&all(greaterThanEqual(shadow.xy,vec2(0.)))&&all(lessThanEqual(shadow.xy,vec2(1.)))&&shadow.z>texture2D(shadowMap,shadow.xy).r)color*=.25;
        gl_FragColor=vec4(color,1.);}`});
  material.userData.update=mesh=>{
    const center=new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);let total=0;const light=new THREE.Vector3();
    const add=(pos)=>{const p=new THREE.Vector3(...pos),w=1/Math.max(1e-8,p.distanceToSquared(center));light.addScaledVector(p,w);total+=w;};
    add([0,0,0]);for(const l of simulation.bloblets)add(l.position);
    material.uniforms.lightPosition.value.copy(light.multiplyScalar(1/total));material.uniforms.intensity.value=simulation.intensity*2;
  };
  return material;
}
