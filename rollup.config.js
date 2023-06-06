'use strict';

import 'rollup';
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";
import copy from 'rollup-plugin-copy';
import rollupNodeResolve from '@rollup/plugin-node-resolve';
import rollupJson from 'rollup-plugin-json';

/**
 * 
 * @param {string} parameters 
 * @returns {object} paramaters passed from command line are added to the returned object
 */
const paramsToJson = ( parameters ) => {
    const obj = {};
    if ( parameters ) {
        parameters.split( '+' ).map( ( item ) => {
            const [k, v] = item.split( '=' )
            v ? obj[k] = v : null
        } )
    }
    return obj
};

const smokePath = './demo-apps/js/release/';
const reactPath = './demo-apps/react/release/';
const automationPath = './tests/automation/release/';
let commandLineParams = {};

/**
 * process the command line parameters and sets the rollup variables 
 */
const processCommandLineParameters = () => {

    try {
        const argsLength = process.argv.length;
        if ( argsLength < 3 ) {
            return;
        }

        const commandIndex = process.argv.indexOf( '--config-' );
        if ( commandIndex == -1 ) {
            return;
        }

        const command = process.argv[commandIndex + 1].replace( '[', '' ).replace( ']', '' );
        if ( !command ) {
            return;
        }

        commandLineParams = paramsToJson( command );
       
    }
    catch ( e ) {
        console.log( e );
    }
};

processCommandLineParameters();

const plugins = [

    rollupNodeResolve( {  preferBuiltins: false, browser: true } ),
    rollupJson(),
    babel( {
        babelrc: false,
        exclude: ['node_modules/**'],
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        browsers: [
                            'ie >= 10',
                            'safari >= 8'
                        ],
                    },

                    modules: false,
                    useBuiltIns: 'usage',
                    corejs: 3,
                    debug: true
                }
            ]
        ]
    } ),
    typescript( {
        typescript: require( 'typescript' )
    } ),
    commonjs( {
    } ),

];

const { env, polyfill, thin } = commandLineParams;
const minify = env === 'prod';

if ( minify ) {
    plugins.push( terser( {
        mangle: true,
        output: {
            beautify: false,
        }
    } ) );
}

const getLibPath = function ( polyfill, thin ) {
    let libName = '';
    if ( polyfill ) {
        libName = thin ? `dist/imslib-thin-polyfill` : `dist/imslib-polyfill`;
    } else {
        libName = thin ? `dist/imslib-thin` : `dist/imslib`;
    }

    return minify ? `${libName}.min.js` : `${libName}.js`
};

const libPath = getLibPath( polyfill, thin );

plugins.push( copy( {
    hook: 'writeBundle',
    copyOnce: false,
    targets: [
        { src: libPath, dest: smokePath },
        { src: libPath, dest: reactPath },
        { src: libPath, dest: automationPath }
    ]
} ) );

const getEntryPoint  = function ( polyfill, thin ) {
    if( polyfill ) {
        return thin ? 'src/MainThinPolyfill.ts' : 'src/MainPolyfill.ts';
    }
    return thin ? 'src/MainThin.ts' : 'src/Main.ts';
};

const entryPoint = getEntryPoint( polyfill, thin );

const config = {
    input: entryPoint,
    output: {
        file: `./${libPath}`,
        format: "iife",
        name: "roll",
        strict: false
    },
    plugins,
};

export default config