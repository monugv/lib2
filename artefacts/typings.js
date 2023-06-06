/* eslint-disable @typescript-eslint/explicit-function-return-type */
const fs = require( "fs" );
const fse = require( "fs-extra" );

function copyFileSync ( source, dest ) {
    fs.copyFileSync( source, dest );
}

function renameFileSync ( source, target ) {
    fs.renameSync( source, target );
}

function copyFolderRecursiveSync ( source, target ) {
    fs.mkdirSync( target, { recursive: true } );

    fse.copySync( source, target );
}

function deleteFileSync ( path ) {
    fs.unlinkSync( path );
}

copyFolderRecursiveSync( "lib", "artefacts/imslib" );

fs.mkdirSync( "artefacts/imslib-thin", { recursive: true } );
renameFileSync(
    "artefacts/imslib/MainThin.js",
    "artefacts/imslib-thin/MainThin.js"
);
renameFileSync(
    "artefacts/imslib/MainThin.d.ts",
    "artefacts/imslib-thin/MainThin.d.ts"
);
renameFileSync(
    "artefacts/imslib/ImsThinInitialization.js",
    "artefacts/imslib-thin/ImsThinInitialization.js"
);
renameFileSync(
    "artefacts/imslib/ImsThinInitialization.d.ts",
    "artefacts/imslib-thin/ImsThinInitialization.d.ts"
);

fs.mkdirSync( "artefacts/imslib-thin/adobe-ims", { recursive: true } );
renameFileSync(
    "artefacts/imslib/adobe-ims/AdobeIMSThin.js",
    "artefacts/imslib-thin/adobe-ims/AdobeIMSThin.js"
);
renameFileSync(
    "artefacts/imslib/adobe-ims/AdobeIMSThin.d.ts",
    "artefacts/imslib-thin/adobe-ims/AdobeIMSThin.d.ts"
);

copyFolderRecursiveSync( "artefacts/imslib/url", "artefacts/imslib-thin/url" );
copyFolderRecursiveSync( "artefacts/imslib/api-helpers", "artefacts/imslib-thin/api-helpers" );
copyFolderRecursiveSync( "artefacts/imslib/log", "artefacts/imslib-thin/log" );
copyFolderRecursiveSync( "artefacts/imslib/util", "artefacts/imslib-thin/util" );
copyFolderRecursiveSync( "artefacts/imslib/storage", "artefacts/imslib-thin/storage" );
copyFolderRecursiveSync( "artefacts/imslib/adobe-ims/facade", "artefacts/imslib-thin/adobe-ims/facade" );
copyFolderRecursiveSync( "artefacts/imslib/adobe-ims/pkce", "artefacts/imslib-thin/adobe-ims/pkce" );

copyFolderRecursiveSync(
    "artefacts/imslib/facade",
    "artefacts/imslib-thin/facade"
);
copyFolderRecursiveSync(
    "artefacts/imslib/constants",
    "artefacts/imslib-thin/constants"
);

copyFolderRecursiveSync(
    "artefacts/imslib/adobe-ims/sign-in",
    "artefacts/imslib-thin/adobe-ims/sign-in"
);
copyFolderRecursiveSync(
    "artefacts/imslib/adobe-ims/sign-out",
    "artefacts/imslib-thin/adobe-ims/sign-out"
);
copyFolderRecursiveSync(
    "artefacts/imslib/adobe-ims/helpers",
    "artefacts/imslib-thin/adobe-ims/helpers"
);
copyFolderRecursiveSync(
    "artefacts/imslib/adobe-ims/environment",
    "artefacts/imslib-thin/adobe-ims/environment"
);

fs.mkdirSync( "artefacts/imslib-thin/adobe-id/custom-types", { recursive: true } );
copyFileSync(
    "artefacts/imslib/adobe-id/IAnalytics.d.ts",
    "artefacts/imslib-thin/adobe-id/IAnalytics.d.ts"
);
copyFileSync(
    "artefacts/imslib/adobe-id/IAnalytics.js",
    "artefacts/imslib-thin/adobe-id/IAnalytics.js"
);
copyFileSync(
    "artefacts/imslib/adobe-id/custom-types/CustomThinTypes.d.ts",
    "artefacts/imslib-thin/adobe-id/custom-types/CustomThinTypes.d.ts"
);
copyFileSync(
    "artefacts/imslib/adobe-id/custom-types/CustomThinTypes.js",
    "artefacts/imslib-thin/adobe-id/custom-types/CustomThinTypes.js"
);
copyFileSync(
    "artefacts/imslib/adobe-id/AdobeIdThinData.d.ts",
    "artefacts/imslib-thin/adobe-id/AdobeIdThinData.d.ts"
);
copyFileSync(
    "artefacts/imslib/adobe-id/AdobeIdThinData.js",
    "artefacts/imslib-thin/adobe-id/AdobeIdThinData.js"
);
copyFileSync(
    "artefacts/imslib/adobe-id/IAdobeIdThinData.d.ts",
    "artefacts/imslib-thin/adobe-id/IAdobeIdThinData.d.ts"
);
copyFileSync(
    "artefacts/imslib/adobe-id/IAdobeIdThinData.js",
    "artefacts/imslib-thin/adobe-id/IAdobeIdThinData.js"
);
copyFileSync(
    "artefacts/imslib/adobe-id/IEnvironment.d.ts",
    "artefacts/imslib-thin/adobe-id/IEnvironment.d.ts"
);
copyFileSync(
    "artefacts/imslib/adobe-id/IEnvironment.js",
    "artefacts/imslib-thin/adobe-id/IEnvironment.js"
);

copyFileSync(
    "artefacts/imslib/adobe-id/AnalyticsParameters.js",
    "artefacts/imslib-thin/adobe-id/AnalyticsParameters.js"
);


copyFileSync(
    "artefacts/imslib/adobe-id/AnalyticsParameters.d.ts",
    "artefacts/imslib-thin/adobe-id/AnalyticsParameters.d.ts"
);

copyFileSync(
    "artefacts/imslib/adobe-id/ICodeChallenge.d.ts",
    "artefacts/imslib-thin/adobe-id/ICodeChallenge.d.ts"
);


//imslib-polyfill

copyFolderRecursiveSync( "artefacts/imslib", "artefacts/imslib-polyfill" );
renameFileSync(
    "artefacts/imslib/MainPolyfill.js",
    "artefacts/imslib-polyfill/MainPolyfill.js"
);
renameFileSync(
    "artefacts/imslib/MainPolyfill.d.ts",
    "artefacts/imslib-polyfill/MainPolyfill.d.ts"
);
deleteFileSync( "artefacts/imslib-polyfill/Main.js" );
deleteFileSync( "artefacts/imslib-polyfill/Main.d.ts" );
deleteFileSync( "artefacts/imslib-polyfill/MainThinPolyfill.d.ts" );
deleteFileSync( "artefacts/imslib-polyfill/MainThinPolyfill.js" );

copyFolderRecursiveSync(
    "artefacts/imslib-thin",
    "artefacts/imslib-thin-polyfill"
);
renameFileSync(
    "artefacts/imslib/MainThinPolyfill.d.ts",
    "artefacts/imslib-thin-polyfill/MainThinPolyfill.d.ts"
);
renameFileSync(
    "artefacts/imslib/MainThinPolyfill.js",
    "artefacts/imslib-thin-polyfill/MainThinPolyfill.js"
);
deleteFileSync( "artefacts/imslib-thin-polyfill/MainThin.js" );
deleteFileSync( "artefacts/imslib-thin-polyfill/MainThin.d.ts" );

// copy index files to imslib
copyFileSync( "artefacts/indexIMSLib.d.ts", "artefacts/imslib/index.d.ts" );
copyFileSync( "artefacts/indexIMSLib.js", "artefacts/imslib/index.js" );

//copy package.json files to imslib
copyFileSync( "artefacts/package.json", "artefacts/imslib/package.json" );
copyFileSync(
    "artefacts/package-lock.json",
    "artefacts/imslib/package-lock.json"
);


// copy or move thin files to the imslib-thin

//imslib-polyfill
copyFileSync(
    "artefacts/indexAdobeIMSPolyfill.d.ts",
    "artefacts/imslib-polyfill/index.d.ts"
);
copyFileSync(
    "artefacts/indexAdobeIMSPolyfill.js",
    "artefacts/imslib-polyfill/index.js"
);

copyFileSync(
    "artefacts/package-polyfill.json",
    "artefacts/imslib-polyfill/package.json"
);

copyFileSync(
    "artefacts/package-polyfill-lock.json",
    "artefacts/imslib-polyfill/package-lock.json"
);

// imslib-thin
copyFileSync(
    "artefacts/indexIMSLIb-Thin.d.ts",
    "artefacts/imslib-thin/index.d.ts"
);
copyFileSync( "artefacts/indexIMSLIb-Thin.js", "artefacts/imslib-thin/index.js" );

copyFileSync(
    "artefacts/package-thin.json",
    "artefacts/imslib-thin/package.json"
);
copyFileSync(
    "artefacts/package-thin-lock.json",
    "artefacts/imslib-thin/package-lock.json"
);

//imslib-thin-polyfill

copyFileSync(
    "artefacts/indexIMSLIb-Thin.d.ts",
    "artefacts/imslib-thin-polyfill/index.d.ts"
);
copyFileSync(
    "artefacts/indexIMSLIb-Thin.js",
    "artefacts/imslib-thin-polyfill/index.js"
);

copyFileSync(
    "artefacts/package-thin-polyfill.json",
    "artefacts/imslib-thin-polyfill/package.json"
);
copyFileSync(
    "artefacts/package-thin-polyfill-lock.json",
    "artefacts/imslib-thin-polyfill/package-lock.json"
);
