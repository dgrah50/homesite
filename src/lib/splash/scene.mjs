import * as THREE from 'three';
import {sceneSample,mix,sourceSlerp} from './simulation.mjs';

export function buildRevolvedGeometry(v) {
  const tail=v.slice(-8),axis=new THREE.Vector3(...tail.slice(0,3)).normalize(),pivot=new THREE.Vector3(...tail.slice(3,6));
  const segments=tail[6],count=tail[7];
  const points=Array.from({length:count},(_,i)=>new THREE.Vector3(...v.slice(i*4,i*4+3)));
  const segmentNormals=points.map((p,i)=>{
    const next=points[(i+1)%count],tangent=new THREE.Vector3().crossVectors(axis,next.clone().sub(pivot));
    return tangent.cross(next.clone().sub(p)).normalize();
  });
  const profile=[],profileNormals=[];
  for(let i=0;i<count;i++) {
    const incoming=segmentNormals[(i+count-1)%count],outgoing=segmentNormals[i];
    if(v[i*4+3]&1) {
      profile.push(points[i]);profileNormals.push(incoming.clone().add(outgoing).normalize());
    } else {
      profile.push(points[i],points[i]);profileNormals.push(incoming,outgoing);
    }
  }
  const positions=[],normals=[],indices=[],stride=profile.length;
  for(let s=0;s<=segments;s++) for(let i=0;i<stride;i++) {
    const angle=2*Math.PI*s/segments;
    const p=profile[i].clone().sub(pivot).applyAxisAngle(axis,angle).add(pivot);
    const n=profileNormals[i].clone().applyAxisAngle(axis,angle);
    positions.push(p.x,p.y,p.z);normals.push(n.x,n.y,n.z);
  }
  for(let s=0;s<segments;s++) for(let i=0;i<stride;i++) {
    const next=(i+1)%stride,a=s*stride+i,b=a+stride,c=s*stride+next,d=c+stride;
    // Source triangle strip: right, left, next-right, next-left.
    // Reverse for WebGL front faces, retaining the source strip diagonal.
    indices.push(a,b,d,a,d,c);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  g.setIndex(indices);return g;
}

export function buildScene(data,material,retailMeshes=null) {
  const objects=new THREE.Group();
  const metal=material ?? new THREE.MeshBasicMaterial({side:THREE.FrontSide});
  // These are inverse quaternions: the original uses row-vector LH rotations.
  const quat=q=>new THREE.Quaternion(-q[0],-q[1],-q[2],q[3]);
  const quats=data.quats.map(quat), animations=[];
  const geometryCache=new Map();
  for(const [kind,{instances,versions}] of Object.entries(data.primitives)) for(const row of instances) {
    const sphere=kind==='Sphere',base=sphere?0:1;
    const [tx,ty,tz,version,posAnim,rotAnim]=row.slice(base,base+6),v=versions[version];
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
      if(retailMeshes)g=makeRetail(0);
      else switch(kind) {
        case 'Sphere':g=new THREE.SphereGeometry(1,v[0],Math.max(8,v[0]/2));break;
        case 'Cylinder':g=new THREE.CylinderGeometry(1,1,1,v[1],v[0]).rotateX(Math.PI/2).translate(0,0,.5);break;
        case 'Cone':g=new THREE.CylinderGeometry(v[1],v[0],v[2],v[4],v[3]).rotateX(Math.PI/2).translate(0,0,v[2]/2);break;
        case 'Box':g=new THREE.BoxGeometry(1,1,1);break;
        case 'Torus':g=new THREE.TorusGeometry(1,v[0],v[2],v[1]);break;
        case 'SurfOfRev':g=buildRevolvedGeometry(v);break;
      }
      geometryCache.set(key,g);
    }
    const mesh=new THREE.Mesh(g,typeof metal==='function'?metal(kind):metal);
    if(retailMeshes){mesh.userData.geometryHi=g;const loKey=key+':lo';
      if(!geometryCache.has(loKey))geometryCache.set(loKey,makeRetail(1));
      mesh.userData.geometryLo=geometryCache.get(loKey);
    }
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
    if(retailMeshes)for(const mesh of objects.children)mesh.geometry=t>=5.2?mesh.userData.geometryLo:mesh.userData.geometryHi;
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
