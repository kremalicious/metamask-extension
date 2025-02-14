import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Text } from '../../component-library';
import { TextVariant } from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip/tooltip';

const defaultRender = (inner) => inner;
export default function IconButton({
  onClick,
  // Icon,
  disabled,
  label,
  tooltipRender,
  className,
  ...props
}) {
  const renderWrapper = tooltipRender ?? defaultRender;
  return (
    <button
      className={classNames('icon-button', className, {
        'icon-button--disabled': disabled,
      })}
      data-testid={props['data-testid'] ?? undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {renderWrapper(
        <>
          {label.length > 9 ? (
            <Tooltip title={label} position="bottom">
              <Text
                className="icon-button__label"
                ellipsis
                variant={TextVariant.bodySm}
              >
                {label}
              </Text>
            </Tooltip>
          ) : (
            <Text
              className="icon-button__label"
              ellipsis
              variant={TextVariant.bodySm}
            >
              {label}
            </Text>
          )}
        </>,
      )}
    </button>
  );
}

IconButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  Icon: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  tooltipRender: PropTypes.func,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
};
