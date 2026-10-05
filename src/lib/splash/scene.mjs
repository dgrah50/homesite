import * as THREE from 'three';
import {sceneSample,mix,sourceSlerp} from './simulation.mjs';

export function buildScene(data,material,retailMeshes) {
  const objects=new THREE.Group();
  // These are inverse quaternions: the original uses row-vector LH rotations.
  const quat=q=>new THREE.Quaternion(-q[0],-q[1],-q[2],q[3]);
  const quats=data.quats.map(quat), animations=[];
  const geometryCache=new Map();
  for(const [kind,{instances}] of Object.entries(data.primitives)) for(const row of instances) {
    const sphere=kind==='Sphere',base=sphere?0:1;
    const [tx,ty,tz,version,posAnim,rotAnim]=row.slice(base,base+6);
    const key=kind+':'+(kind==='Box'?0:version);let g=geometryCache.get(key);
    const makeRetail=bias=>{
      const asset=retailMeshes[key+':'+bias];
      if(!asset)throw new Error(`Missing retail mesh ${key}:${bias}`);
      const geometry=new THREE.BufferGeometry();
      for(const [attribute,field,size] of [['position','positions',3],['normal','normals',3],['uv','uv',2],['tangentS','tangentS',3],['tangentT','tangentT',3]])
        geometry.setAttribute(attribute,new THREE.Float32BufferAttribute(asset[field],size));
      geometry.setIndex(asset.indices);return geometry;
    };
    if(!g) {
      g=makeRetail(0);
      geometryCache.set(key,g);
    }
    const mesh=new THREE.Mesh(g,material(kind));
    mesh.userData.geometryHi=g;const loKey=key+':lo';
    if(!geometryCache.has(loKey))geometryCache.set(loKey,makeRetail(1));
    mesh.userData.geometryLo=geometryCache.get(loKey);
    const translation=new THREE.Vector3(tx*.004131-27.844984,ty*.008252-.228729,tz*.004421+.497086);
    const rotation=sphere?new THREE.Quaternion():quats[row[0]].clone();
    const size=row.slice(base+6);
    if(sphere) mesh.scale.setScalar(size[0]);
    if(kind==='Cylinder')mesh.scale.set(size[0],size[0],size[1]*2);
    if(kind==='Torus')mesh.scale.setScalar(size[0]);
    if(kind==='Box')mesh.scale.set(size[2],size[0],size[1]);
    mesh.position.copy(translation);mesh.quaternion.copy(rotation);mesh.name=`${kind} ${objects.children.length}`;objects.add(mesh);
    if(posAnim>=0||rotAnim>=0)animations.push({mesh,translation,rotation,posAnim,rotAnim});
  }

  function advance(t) {
    for(const mesh of objects.children)mesh.geometry=t>=5.2?mesh.userData.geometryLo:mesh.userData.geometryHi;
    const {index,fraction:s}=sceneSample(t);
    for(const a of animations) {
      const q=a.rotAnim<0?new THREE.Quaternion():quat(sourceSlerp(data.quats[data.rotSequences[a.rotAnim][index]],data.quats[data.rotSequences[a.rotAnim][index+1]],s));
      a.mesh.position.copy(a.translation).applyQuaternion(q);
      a.mesh.quaternion.copy(q).multiply(a.rotation);
      if(a.posAnim>=0){const seq=data.posSequences[a.posAnim];a.mesh.position.add(new THREE.Vector3(...mix(data.positions[seq[index]],data.positions[seq[index+1]],s)));}
    }
  }
  advance(0);
  for(const mesh of objects.children)mesh.userData.initialHiZ=mesh.position.z>0;
  return {objects,advance};
}
