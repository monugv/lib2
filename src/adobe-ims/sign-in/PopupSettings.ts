
/**
 * class used to store the modal settings
 */
export class PopupSettings {
    title = 'Adobe ID';

    allowOrigin?: string;

    width = 600;

    height: 700;

    top = 100;

    left = 100;

    constructor ( data: any = {} ) {
        const { title = 'Adobe ID', width = 600, height = 700, top=100, left=100, allowedOrigin } = data;
        this.title = title;
        this.width = width;
        this.height = height;
        this.top = top;
        this.left = left;
        this.allowOrigin = allowedOrigin;
    }
}