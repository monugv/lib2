import { IFragmentExceptionType } from './IFragmentExceptionType';

export class FragmentException  {

    message = '';
    type = '';
    constructor ( type: IFragmentExceptionType, message: string ) {
        this.type = type;
        this.message = message;
    }
}