// A clean interior view. Hide complete outer housings instead of cutting
// camera-dependent holes through their fragments. All inner apparatus remains
// opaque; the complete source housings can be enabled for inspection.
export function chamberVisibility(objects) {
  const housings=objects.children.filter(mesh=>mesh.name.startsWith('SurfOfRev '));
  return {housings,update(showHousings) {
    for(const mesh of housings) mesh.visible=showHousings;
  }};
}
