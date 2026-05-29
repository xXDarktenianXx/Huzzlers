javascript
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../android/app/build/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/com\.huzzlers\.BuildConfig/g, 'com.huzzlers.app.BuildConfig');
  fs.writeFileSync(filePath, content);
  console.log('Fixed autolinking entry point');
}