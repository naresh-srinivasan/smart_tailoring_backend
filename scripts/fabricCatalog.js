// Fabric catalogue shared by seed.js and addFabrics.js.
// [material_name, material_type, color, color_code, pattern, stock (m), price per m, image in frontend/public/fabrics]
export const FABRICS = [
  ["Cotton", "fabric", "Blue", "#3B82F6", "Plain", 120, 200, "cotton-blue-plain"],
  ["Cotton", "fabric", "White", "#FFFFFF", "Striped", 90, 220, "cotton-white-striped"],
  ["Cotton", "fabric", "Navy", "#1E3A8A", "Checked", 70, 240, "cotton-navy-checked"],
  ["Cotton", "fabric", "Pink", "#EC4899", "Plain", 55, 210, "cotton-pink-plain"],
  ["Linen", "fabric", "White", "#F5F5F0", "Plain", 80, 380, "linen-white-plain"],
  ["Linen", "fabric", "Beige", "#D8C3A5", "Plain", 60, 350, "linen-beige-plain"],
  ["Linen", "fabric", "Sky Blue", "#87CEEB", "Plain", 45, 360, "linen-skyblue-plain"],
  ["Silk", "fabric", "Maroon", "#800000", "Plain", 40, 650, "silk-maroon-plain"],
  ["Silk", "fabric", "Emerald", "#0F6B52", "Plain", 35, 690, "silk-emerald-plain"],
  ["Silk", "fabric", "Gold", "#C9A24A", "Plain", 28, 720, "silk-gold-plain"],
  ["Velvet", "fabric", "Green", "#166534", "Plain", 25, 800, "velvet-green-plain"],
  ["Velvet", "fabric", "Navy", "#1B2A5E", "Plain", 30, 820, "velvet-navy-plain"],
  ["Velvet", "fabric", "Maroon", "#6E1630", "Plain", 22, 840, "velvet-maroon-plain"],
  ["Chiffon", "fabric", "Pink", "#F9A8D4", "Floral", 18, 450, "chiffon-pink-floral"],
  ["Chiffon", "fabric", "Peach", "#F6C9AE", "Plain", 32, 420, "chiffon-peach-plain"],
  ["Polyester", "fabric", "Black", "#111111", "Checked", 150, 150, "polyester-black-checked"],
  ["Polyester", "fabric", "Grey", "#8C9097", "Plain", 110, 140, "polyester-grey-plain"],
  ["Polyester", "fabric", "Charcoal", "#3A3D44", "Striped", 85, 160, "polyester-charcoal-striped"],
];
export const imagePath = (slug) => `/fabrics/${slug}.jpg`;
