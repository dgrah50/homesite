// Three authored lighting studies on the same matched-bowl geometry.
export const LIGHTING_STUDIES={
  soft:{title:'A · Soft lime',description:'Broad lime light fills the bowl. Gentle shadows and a diffuse white center keep the letters readable.',
    rim:[.075,.19,.007],floor:[.57,.84,.035],core:[.93,1.,.77],halo:[.22,.3,.13],
    coreSpread:[9.,15.],spillSpread:[7.,16.],haloSpread:[15.,26.],
    ambient:.88,heatStart:-.04,heatEnd:.9,coreStrength:.48,spillStrength:.44,haloStrength:.18,energyMin:.7},
  volcanic:{title:'B · Volcanic core',description:'A hotter white source at the split, vivid green below, and dark rims. The strongest sense of light escaping from depth.',
    rim:[.009,.055,.003],floor:[.66,.94,.018],core:[1.,1.,.9],halo:[.3,.34,.2],
    coreSpread:[5.3,9.],spillSpread:[5.,15.],haloSpread:[11.,25.],
    ambient:.67,heatStart:.02,heatEnd:.72,coreStrength:1.,spillStrength:1.05,haloStrength:.24,energyMin:.5},
  emerald:{title:'C · Deep emerald',description:'Cooler green light sits beneath shadowed slopes. A smaller pale core gives the crater a quieter, deeper mood.',
    rim:[.004,.04,.012],floor:[.095,.67,.07],core:[.83,1.,.79],halo:[.075,.27,.11],
    coreSpread:[4.3,7.],spillSpread:[4.2,11.],haloSpread:[9.,18.],
    ambient:.63,heatStart:.04,heatEnd:.85,coreStrength:.65,spillStrength:.5,haloStrength:.24,energyMin:.5}
};
