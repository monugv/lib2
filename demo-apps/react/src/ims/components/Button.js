import React, {Component} from 'react';
import PropTypes from 'prop-types';

import './button.css';

export default class Button extends Component {
  
  render() {
    const {handler, text} = this.props;
    return (
      <button className="btn" onClick={() => handler()}>
        {text}  
      </button>
    );
  }
}

Button.propTypes = {
  handler: PropTypes.func,
  text: PropTypes.string
};
