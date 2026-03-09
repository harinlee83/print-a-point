const fs = require('fs');

const { PRODUCT_TYPES } = require('./shared/productCatalog.ts'); // Wait, require won't work easily with TS.

// I'll just read from products.json directly to see what variants product ID 1 has.
const productsData = JSON.parse(fs.readFileSync('./products.json', 'utf8'));
const poster = productsData.find(p => p.productId === 1);
const framedPoster = productsData.find(p => p.productId === 2);

console.log("Poster variants:");
poster.variants.forEach(v => console.log(v.size));

console.log("\nFramed Poster variants:");
framedPoster.variants.forEach(v => console.log(v.size));
