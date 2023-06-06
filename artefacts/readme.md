# Create artefacts
   the artefacts are created by running the following command
   `npm run artefactbuild`

   after runnig the above command, the artifacts will contain all the necesarry files under the artefacts/imslib directory

# Explanation of artefactbuild command:

   1. tsc - compile all sources into the lib directory and create the declaration files as well
   2. npm run artefact-bundle - execute the javascript build/createArtefactBundles.js file by using nodejs. It create the bundle files into the build directory
   3. npm run copytypings - execute the javascript build/typings.js file by using nodejs. 
     - copy the build/stg1, build/prod files to artefacts directory
     - copy the declaration files "FILE_NAME.d.ts" to the artefacts  directory.

     -- should
     -- 1. copy all lib files (only the declaration files)
     -- 2. copy the stage files on adobe-ims dircetory
     -- this should work! 

   4. publish the generated package should be done by a jenkins job

   5. Usage
      import { AdobeIMS, AdobeIMSThin, AdobeIMSPolyfill, AdobeIMSThinPolyfill } from '@identity/imslib';
      const adobeIms = new AdobeIMS();
      adobeIms.initialize();

# Note
   artefacts directory contains the package.json file. the important elements from the file are
    - package version
    - dependencies used by the library
