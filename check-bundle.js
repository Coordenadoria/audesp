const fs = require('fs');
const path = require('path');

// Check build folder
const buildDir = path.join(__dirname, 'build');
const indexHtml = path.join(buildDir, 'index.html');
const mainJs = path.join(buildDir, 'static/js');

console.log('\n=== BUNDLE DIAGNOSTICS ===\n');

if (fs.existsSync(indexHtml)) {
  const content = fs.readFileSync(indexHtml, 'utf8');
  console.log('✓ index.html exists');
  console.log(`  Size: ${(content.length / 1024).toFixed(2)} KB`);
  
  // Check if main.js is referenced
  if (content.includes('static/js/main')) {
    console.log('✓ main.js is referenced in HTML');
  } else {
    console.log('✗ main.js is NOT referenced in HTML');
  }
  
  // Check if root element exists
  if (content.includes('id="root"')) {
    console.log('✓ Root element found in HTML');
  } else {
    console.log('✗ Root element NOT found in HTML');
  }
} else {
  console.log('✗ index.html NOT found');
}

// Check main.js
if (fs.existsSync(mainJs)) {
  const files = fs.readdirSync(mainJs);
  console.log(`\n✓ Main JS folder found with ${files.length} files:`);
  files.forEach(f => {
    const size = fs.statSync(path.join(mainJs, f)).size;
    console.log(`  - ${f} (${(size / 1024).toFixed(2)} KB)`);
  });
} else {
  console.log('\n✗ Main JS folder NOT found');
}

console.log('\n=== END DIAGNOSTICS ===\n');
