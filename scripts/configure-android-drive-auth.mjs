import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const appGradlePath = resolve(root, 'android/app/build.gradle');
const mainActivityPath = resolve(root, 'android/app/src/main/java/com/cashx/app/MainActivity.java');
const pluginSourcePath = resolve(root, 'native/android/CashXGoogleDriveAuthorizationPlugin.java');
const pluginTargetPath = resolve(root, 'android/app/src/main/java/com/cashx/app/CashXGoogleDriveAuthorizationPlugin.java');
const dependency = "    implementation 'com.google.android.gms:play-services-auth:22.0.0'";

async function configureGradle() {
  let source = await readFile(appGradlePath, 'utf8');
  if (source.includes(dependency)) {
    return;
  }

  const marker = 'dependencies {';
  if (source.split(marker).length !== 2) {
    throw new Error('Expected exactly one Android dependencies block.');
  }

  source = source.replace(marker, `${marker}\n${dependency}`);
  await writeFile(appGradlePath, source, 'utf8');
}

async function configureMainActivity() {
  let source = await readFile(mainActivityPath, 'utf8');
  const registration = 'registerPlugin(CashXGoogleDriveAuthorizationPlugin.class);';
  if (source.includes(registration)) {
    return;
  }

  const classPattern = /public class MainActivity extends BridgeActivity \{\s*\}/;
  if (!classPattern.test(source)) {
    throw new Error('MainActivity is not the expected generated Capacitor shell; refusing to overwrite custom code.');
  }

  if (!source.includes('import android.os.Bundle;')) {
    source = source.replace(
      'package com.cashx.app;\n',
      'package com.cashx.app;\n\nimport android.os.Bundle;\n',
    );
  }

  source = source.replace(
    classPattern,
    [
      'public class MainActivity extends BridgeActivity {',
      '    @Override',
      '    public void onCreate(Bundle savedInstanceState) {',
      '        registerPlugin(CashXGoogleDriveAuthorizationPlugin.class);',
      '        super.onCreate(savedInstanceState);',
      '    }',
      '}',
    ].join('\n'),
  );

  await writeFile(mainActivityPath, source, 'utf8');
}

await configureGradle();
await configureMainActivity();
await mkdir(dirname(pluginTargetPath), { recursive: true });
await copyFile(pluginSourcePath, pluginTargetPath);

console.log('CASHX_ANDROID_DRIVE_AUTH_CONFIGURED');
