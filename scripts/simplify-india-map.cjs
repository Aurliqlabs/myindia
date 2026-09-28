/* Creates the small, browser-safe state map used by the India Field Map desk.
 * Source: Bharatlas LGD 2024 / geoBoundaries, CC-BY-4.0. */
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const source=path.join(root,"assets","data","india-adm1-source.geojson");
const output=path.join(root,"assets","data","india-adm1-2024-simplified.json");
const NAMES={"IN-AN":"Andaman and Nicobar Islands","IN-AP":"Andhra Pradesh","IN-AR":"Arunachal Pradesh","IN-AS":"Assam","IN-BR":"Bihar","IN-CH":"Chandigarh","IN-CT":"Chhattisgarh","IN-DH":"Dadra and Nagar Haveli and Daman and Diu","IN-DL":"Delhi","IN-GA":"Goa","IN-GJ":"Gujarat","IN-HP":"Himachal Pradesh","IN-HR":"Haryana","IN-JH":"Jharkhand","IN-JK":"Jammu and Kashmir","IN-KA":"Karnataka","IN-KL":"Kerala","IN-LA":"Ladakh","IN-LD":"Lakshadweep","IN-MH":"Maharashtra","IN-ML":"Meghalaya","IN-MN":"Manipur","IN-MP":"Madhya Pradesh","IN-MZ":"Mizoram","IN-NL":"Nagaland","IN-OR":"Odisha","IN-PB":"Punjab","IN-PY":"Puducherry","IN-RJ":"Rajasthan","IN-SK":"Sikkim","IN-TG":"Telangana","IN-TN":"Tamil Nadu","IN-TR":"Tripura","IN-UP":"Uttar Pradesh","IN-UT":"Uttarakhand","IN-WB":"West Bengal"};
function simplifyRing(ring){if(ring.length<4)return ring;const out=[ring[0]];let last=ring[0];for(let i=1;i<ring.length-1;i++){const p=ring[i],dx=p[0]-last[0],dy=p[1]-last[1];if(dx*dx+dy*dy>=0.0009){out.push(p);last=p;}}out.push(ring[ring.length-1]);return out.length>3?out:ring;}
function simplifyGeometry(g){const mapPoly=p=>p.map(simplifyRing);return g.type==="Polygon"?{type:g.type,coordinates:mapPoly(g.coordinates)}:{type:g.type,coordinates:g.coordinates.map(mapPoly)};}
const raw=JSON.parse(fs.readFileSync(source,"utf8"));
const map={type:"FeatureCollection",attribution:"India ADM1 boundaries: Bharatlas LGD 2024 / geoBoundaries, CC-BY-4.0.",features:raw.features.map(f=>({type:"Feature",properties:{name:NAMES[f.properties.shapeISO]||f.properties.shapeName,iso:f.properties.shapeISO},geometry:simplifyGeometry(f.geometry)}))};
fs.writeFileSync(output,JSON.stringify(map));
console.log(`${map.features.length} features -> ${fs.statSync(output).size} bytes`);
