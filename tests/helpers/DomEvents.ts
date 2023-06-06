
class DomEvents {
    simulateMouseMove ( target, options = {} ): void {

        const event = target.createEvent( 'MouseEvents' ),
            opts = { // These are the default values, set up for un-modified left clicks
                type: 'mousemove',
                canBubble: true,
                cancelable: true,
                view: target.defaultView,
                detail: 1,
                screenX: 0, //The coordinates within the entire page
                screenY: 0,
                clientX: 0, //The coordinates within the viewport
                clientY: 0,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
                button: 0, //0 = left, 1 = middle, 2 = right
                relatedTarget: null,
            };

        //Merge the options with the defaults
        for ( const key in options ) {
            if ( options.hasOwnProperty( key ) ) {
                opts[key] = options[key];
            }
        }

        //Pass in the options
        event.initMouseEvent(
            opts.type,
            opts.canBubble,
            opts.cancelable,
            opts.view,
            opts.detail,
            opts.screenX,
            opts.screenY,
            opts.clientX,
            opts.clientY,
            opts.ctrlKey,
            opts.altKey,
            opts.shiftKey,
            opts.metaKey,
            opts.button,
            opts.relatedTarget
        );

        //Fire the event
        target.dispatchEvent( event );
    }
}

export default new DomEvents();