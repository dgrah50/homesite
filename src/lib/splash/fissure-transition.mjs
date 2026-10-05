export const CRATER_REVEAL_START=5.70;
export const CRATER_REVEAL_END=5.80;

export function craterBlend(t){
  const u=Math.max(0,Math.min(1,(t-CRATER_REVEAL_START)/(CRATER_REVEAL_END-CRATER_REVEAL_START)));
  return u*u*(3-2*u);
}

// Once the crater owns the frame, uncovered ground must stay black. The
// chamber compositor otherwise adds its boot flash wherever logo depth is clear.
export function logoRenderState(camera,t,style){
  return style==='fissure'&&camera.renderLogo&&t>=CRATER_REVEAL_END
    ? {...camera,renderScene:false}
    : camera;
}
