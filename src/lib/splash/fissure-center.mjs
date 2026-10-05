// Independent source studies: leave the selected green bowl lighting intact.
export const CENTER_STUDIES={
  original:{title:'Baseline · Diffuse center',description:'The committed soft lime center.',mode:0},
  seam:{title:'1 · White seam',description:'A narrow white opening with tapered ends and restrained lime spill.',mode:1,core:[1,1,.9],coreSpread:[2.2,11],spillSpread:[3.6,14],haloSpread:[9,19],coreStrength:1,spillStrength:.88,haloStrength:.13},
  well:{title:'2 · Molten well',description:'A rounded white source beneath the join, with a soft pool of light on the slopes.',mode:2,core:[1,1,.9],coreSpread:[5,7],spillSpread:[7.5,10],haloSpread:[14,18],coreStrength:1,spillStrength:.76,haloStrength:.19},
  split:{title:'3 · Four-way split',description:'White light follows the four diagonal cuts and fades smoothly into the green bowls.',mode:3,core:[1,1,.9],coreSpread:[3,13],spillSpread:[4.8,17],haloSpread:[12,22],coreStrength:1,spillStrength:.85,haloStrength:.16},
  'soft-split':{title:'4 · Soft diagonal glow',description:'The diffuse center stretches gently toward all four corners, with broad falloff and a soft lime-white glow.',mode:4,core:[.93,1,.77],coreSpread:[8,40],spillSpread:[10,42],haloSpread:[16,48],coreStrength:.48,spillStrength:.44,haloStrength:.18}
};
