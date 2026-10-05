import * as THREE from 'three';
import {texture} from './textures.mjs';
import {clamp} from './simulation.mjs';
const quadVertex='varying vec2 vUV;void main(){vUV=uv;gl_Position=vec4(position.xy,0.,1.);}';

export function retailFog(renderer,scene,camera,objects,simulation,{highQuality=false,prepared}={}){
  const target=new THREE.WebGLRenderTarget(640,480,{samples:highQuality?4:0});target.depthTexture=new THREE.DepthTexture(640,480);
  const bufferSize=new THREE.Vector2();
  const intensityTarget=new THREE.WebGLRenderTarget(1024,512);
  const intensityScene=new THREE.Scene(),fogObjects=new THREE.Group();intensityScene.add(fogObjects);
  const uniforms={radius:{value:1},center:{value:new THREE.Vector2()},aspect:{value:.75}};
  const depthMaterial=new THREE.ShaderMaterial({uniforms,side:THREE.FrontSide,
    vertexShader:`uniform float radius;uniform vec2 center;uniform float aspect;varying vec2 vFog;varying float vDepth;
      void main(){vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);vFog=p.xy/p.w*vec2(radius*.005,radius*.005*aspect)+center;vDepth=max(0.,(.5*(p.z+p.w)+40.-radius)/80.);gl_Position=p;}`,
    fragmentShader:`varying vec2 vFog;varying float vDepth;void main(){float r=clamp(1.-dot(vFog,vFog),0.,1.);gl_FragColor=vec4(vec3(clamp(vDepth*r*r,0.,1.)),1.);}`});
  const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
    vertexShader:quadVertex,
    fragmentShader:`uniform float radius;uniform vec2 center;uniform float aspect;varying vec2 vUV;void main(){vec2 p=(vUV*2.-1.)*vec2(radius*.005,radius*.005*aspect)+center;float r=clamp(1.-dot(p,p),0.,1.);gl_FragColor=vec4(vec3(r*r),1.);}`}));
  backdrop.renderOrder=-1;intensityScene.add(backdrop);
  for(const mesh of objects.children){const copy=new THREE.Mesh(mesh.geometry,depthMaterial);copy.matrixAutoUpdate=false;fogObjects.add(copy);}
  const plasma=prepared.plasma.map(pixels=>texture(pixels,256,true));
  const outputUniforms={frame:{value:target.texture},depth:{value:target.depthTexture},intensityMap:{value:intensityTarget.texture},
    plasma0:{value:plasma[0]},plasma1:{value:plasma[1]},plasma2:{value:plasma[2]},glowMap:{value:texture(prepared.glow[0],256)},
    shifts:{value:[new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2()]},scales:{value:new THREE.Vector2()},
    fogIntensity:{value:0},screenGlow:{value:0},circleAlpha:{value:0},circleMul:{value:1},fogOn:{value:false},logoOn:{value:false}};
  const outputScene=new THREE.Scene();outputScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:outputUniforms,depthTest:false,depthWrite:false,
    vertexShader:quadVertex,
    fragmentShader:`varying vec2 vUV;uniform sampler2D frame,depth,intensityMap,plasma0,plasma1,plasma2,glowMap;
      uniform vec2 shifts[3],scales;uniform float fogIntensity,screenGlow,circleAlpha,circleMul;uniform bool fogOn,logoOn;
      void main(){vec3 color=texture2D(frame,vUV).rgb;
        if(fogOn&&(!logoOn||texture2D(depth,vUV).r>=.999999)){
          vec2 base=vec2((vUV.y*2.-1.)*480./256.,-(vUV.x*2.-1.)*640./256.);
          float plasma=texture2D(plasma0,base*scales+shifts[0]).a+texture2D(plasma1,base*scales+shifts[1]).a+texture2D(plasma2,base*scales+shifts[2]).a;
          float fog=texture2D(intensityMap,vUV).r*plasma*fogIntensity;
          color+=vec3(0.,fog,0.)+vec3(.625,1.,.4)*screenGlow;
          vec2 uv=(vUV*2.-1.)*circleMul*.5+.5;
          if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.)))){
            vec4 glow=texture2D(glowMap,uv);color+=glow.rgb*glow.a*vec3(160./255.,1.,96./255.)*circleAlpha;
          }
        }
        gl_FragColor=vec4(clamp(color,0.,1.),1.);}`})));
  const quadCamera=new THREE.Camera();
  let thetaPrevious=Math.PI;
  return {render(t,c,logoScene){
    if(highQuality){renderer.getDrawingBufferSize(bufferSize);if(target.width!==bufferSize.x||target.height!==bufferSize.y)target.setSize(bufferSize.x,bufferSize.y);}
    objects.updateMatrixWorld(true);camera.updateMatrixWorld();const radius=camera.position.length(),aspect=1/camera.aspect,origin=new THREE.Vector3().project(camera);
    uniforms.radius.value=radius;uniforms.aspect.value=aspect;uniforms.center.value.set(-origin.x*radius*.005,-origin.y*radius*.005*aspect);
    for(let i=0;i<objects.children.length;i++){const a=objects.children[i],b=fogObjects.children[i];b.geometry=a.geometry;b.matrix.copy(a.matrixWorld);b.visible=a.visible;}
    renderer.setRenderTarget(intensityTarget);renderer.clear();renderer.render(intensityScene,camera);
    renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);renderer.clearDepth();renderer.render(logoScene,camera);
    let theta=Math.atan2(camera.position.y,camera.position.x);
    while(thetaPrevious-Math.PI>theta)theta+=2*Math.PI;while(thetaPrevious+Math.PI<theta)theta-=2*Math.PI;thetaPrevious=theta;
    const phi=Math.asin(camera.position.z/radius),xm=.5*radius*.005,ym=aspect*radius*.005;
    outputUniforms.scales.value.set(-ym,-xm);
    for(let i=0;i<3;i++){const rad=.6*((2-i)/3-.2);outputUniforms.shifts.value[i].set(-rad*phi+origin.y*ym*480/256,rad*theta-origin.x*xm*640/256);}
    outputUniforms.fogIntensity.value=Math.max(0,simulation.intensity*.7-.1);
    outputUniforms.screenGlow.value=.75*clamp((t-5)/.25);
    let glow=clamp((t-4.7)/.3);if(t<.6)glow=t<.12?t/.12:1-(t-.12)/.6;
    outputUniforms.circleAlpha.value=Math.min(196,Math.trunc(clamp(glow)*255)*2)/255;
    outputUniforms.circleMul.value=t<.6?radius*.6/Math.max(.00001,t*8):.33/Math.max(.00001,glow);
    outputUniforms.fogOn.value=c.renderScene&&(simulation.intensity>0||t<.6);outputUniforms.logoOn.value=c.renderLogo;
    renderer.setRenderTarget(null);renderer.clear();renderer.render(outputScene,quadCamera);
  },dispose(){
    target.depthTexture.dispose();target.dispose();intensityTarget.dispose();depthMaterial.dispose();
    for(const texture of plasma)texture.dispose();outputUniforms.glowMap.value.dispose();
    backdrop.geometry.dispose();backdrop.material.dispose();
    for(const mesh of outputScene.children){mesh.geometry.dispose();mesh.material.dispose();}
  }};
}
