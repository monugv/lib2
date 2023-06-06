import { IDictionary } from './../../src/facade/IDictionary';
import Log from '../../src/log/Log';

describe( 'Log information', () => {

    beforeAll( () => {
        Log.enableLogging();
        console.error = (): boolean => {
            return true;
        }
        console.info = (): boolean => {
            return true;
        }
    } );

    afterAll( () => {
        Log.disableLogging();
    } );

    it( 'Log single information mesage ', () => {
        const printSpy = spyOn( Log, 'print' );

        const message = 'test log info'
        Log.info( message )

        expect( printSpy ).toHaveBeenCalled();
    } );

    it( 'Log multiple information mesages ', () => {
        const printSpy = spyOn( Log, 'print' );
        const infoSpy = spyOn( console, 'info' );

        const message1 = 'test log info'
        const message2 = { adobe: 'cool' };
        Log.info( message1, message2 )

        expect( printSpy ).toHaveBeenCalled();
        expect( printSpy ).toHaveBeenCalledWith( infoSpy, [ message1, message2 ] );
    } );

} );

describe( 'Log errors', () => {
    it( 'Log single error mesage ', () => {
        const printSpy = spyOn( Log, 'print' );
        const errorSpy = spyOn( console, 'error' );
        const message = 'test log info'
        Log.error( message )

        expect( printSpy ).toHaveBeenCalled();
        expect( printSpy ).toHaveBeenCalledWith( errorSpy, [ message ] );
    } );

    it( 'Log multiple information mesages ', () => {
        const printSpy = spyOn( Log, 'print' );
        const errorSpy = spyOn( console, 'error' );

        const message1 = 'test log info'
        const message2 = { adobe: 'cool' };
        Log.error( message1, message2 )

        expect( printSpy ).toHaveBeenCalled();
        expect( printSpy ).toHaveBeenCalledWith( errorSpy, [ message1, message2 ] );
    } );

} );

describe( 'Log assert', () => {

    beforeAll( () => {
        Log.enableLogging();
    } )

    it( 'Not call the assert method from console if first parameter is true', () => {
        const printSpy = spyOn( Log, 'print' );
        const consoleAssertSpy = spyOn( console, 'assert' );

        Log.assert( true, 'yes' )

        expect( printSpy ).toHaveBeenCalled();
        expect( printSpy ).toHaveBeenCalledWith( consoleAssertSpy, [ true, 'yes' ] );

        expect( consoleAssertSpy ).not.toHaveBeenCalled();
    } );

    it( 'Not call the assert method from console if first parameter exists', () => {
        const printSpy = spyOn( Log, 'print' );
        const consoleAssertSpy = spyOn( console, 'assert' );

        Log.assert( "", 'yes' )

        expect( printSpy ).toHaveBeenCalled();
        expect( printSpy ).toHaveBeenCalledWith( consoleAssertSpy, [ '', 'yes' ] );

        expect( consoleAssertSpy ).not.toHaveBeenCalled();
    } );

    it( 'Call the assert method from console if first parameter is false', () => {
        const printSpy = spyOn( Log, 'print' );

        const condition = false;
        Log.assert( condition, 'yes' )

        expect( printSpy ).toHaveBeenCalled();

    } );

    it( 'Not call the assert method from console if first parameter is true', () => {
        const consoleAssertSpy = spyOn( console, 'assert' );

        Log.assertCondition( () => 1 == 1, 'yes' )

        expect( consoleAssertSpy ).not.toHaveBeenCalled();
    } );

    it( 'Call the assert method from console if first parameter is false', () => {
        const printSpy = spyOn( Log, 'print' ).and.callThrough();
        const errorSpy = spyOn( console, 'error' );
        const obj: IDictionary = {};

        const message = 'yes';
        Log.assertCondition( () => obj[ 'prop' ] === 1, message );

        expect( printSpy ).toHaveBeenCalled();
        expect( errorSpy ).toHaveBeenCalled();
    } );

} );
