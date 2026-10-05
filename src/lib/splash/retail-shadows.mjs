import * as THREE from 'three';

// SceneRenderer::updateSBuffer: two 512-square views, split by initial z.
export function retailShadows(renderer,objects,simulation){
  const maps=[false,true].map(hi=>{
    const target=new THREE.WebGLRenderTarget(512,512);target.depthTexture=new THREE.DepthTexture(512,512,THREE.UnsignedShortType);
    const camera=new THREE.PerspectiveCamera(120,1,1,500),scene=new THREE.Scene();
    camera.up.set(0,hi?-1:1,0);
    const material=new THREE.MeshBasicMaterial({colorWrite:false,side:THREE.FrontSide,polygonOffset:true,polygonOffsetFactor:4,polygonOffsetUnits:10});
    const copies=[];
    for(const mesh of objects.children){
      if(!['Torus','Cone','Box','Cylinder'].some(k=>mesh.name.startsWith(k+' '))||mesh.userData.initialHiZ!==hi)continue;
      const copy=new THREE.Mesh(mesh.geometry,material);copy.matrixAutoUpdate=false;scene.add(copy);copies.push({copy,mesh});
    }
    return {target,camera,scene,copies,hi};
  });
  return {update(){
    objects.updateMatrixWorld(true);
    for(const map of maps){
      const query=new THREE.Vector3(0,0,map.hi?40:-30),light=new THREE.Vector3();let total=0;
      for(const pos of [[0,0,0],...simulation.bloblets.map(l=>l.position)]){const p=new THREE.Vector3(...pos),w=1/query.distanceToSquared(p);light.addScaledVector(p,w);total+=w;}
      light.multiplyScalar(1/total);map.camera.position.copy(light);map.camera.lookAt(light.clone().add(new THREE.Vector3(0,0,map.hi?1:-1)));map.camera.updateMatrixWorld();
      for(const {copy,mesh} of map.copies){copy.matrix.copy(mesh.matrixWorld);copy.geometry=mesh.geometry;copy.visible=mesh.visible;}
      renderer.setRenderTarget(map.target);renderer.clear();renderer.render(map.scene,map.camera);
      const matrix=new THREE.Matrix4().multiplyMatrices(map.camera.projectionMatrix,map.camera.matrixWorldInverse);
      for(const mesh of objects.children)if(mesh.userData.initialHiZ===map.hi){mesh.material.uniforms.shadowMatrix.value.copy(matrix);mesh.material.uniforms.shadowMap.value=map.target.depthTexture;}
    }
    renderer.setRenderTarget(null);
  },dispose(){
    for(const map of maps){map.target.depthTexture.dispose();map.target.dispose();map.copies[0]?.copy.material.dispose();}
  }};
}
