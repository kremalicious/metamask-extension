import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import {
  NETWORK_TYPES,
  BUILT_IN_NETWORKS,
} from '../../../../shared/constants/network';

import LoadingIndicator from '../../ui/loading-indicator';
import {
  BorderColor,
  FontWeight,
  Color,
} from '../../../helpers/constants/design-system';
import Chip from '../../ui/chip/chip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isNetworkLoading } from '../../../selectors';
import { Icon, IconName, IconSize } from '../../component-library';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { getNetworkLabelKey } from '../../../helpers/utils/i18n-helper';

export default function NetworkDisplay({
  disabled,
  labelProps,
  targetNetwork,
  onClick,
}) {
  const networkIsLoading = useSelector(isNetworkLoading);
  const providerConfig = useSelector(getProviderConfig);
  const t = useI18nContext();

  const { nickname, type: networkType } = targetNetwork ?? providerConfig;

  return (
    <Chip
      dataTestId="network-display"
      borderColor={BorderColor.transparent}
      onClick={onClick}
      leftIcon={
        <LoadingIndicator
          alt={t('attemptingConnect')}
          title={t('attemptingConnect')}
          isLoading={networkIsLoading}
        />
      }
      rightIcon={
        onClick ? <Icon name={IconName.ArrowDown} size={IconSize.Xs} /> : null
      }
      label={
        networkType === NETWORK_TYPES.RPC
          ? nickname ?? t('privateNetwork')
          : t(getNetworkLabelKey(networkType))
      }
      className={classnames('network-display', {
        'network-display--disabled': disabled,
        'network-display--clickable': typeof onClick === 'function',
      })}
      labelProps={{
        fontWeight: FontWeight.Medium,
        color: Color.textDefault,
        ...labelProps,
      }}
    />
  );
}
NetworkDisplay.propTypes = {
  /**
   * The label props of the label can use most of the Typography props
   */
  labelProps: Chip.propTypes.labelProps,
  /**
   * The target network
   */
  targetNetwork: PropTypes.shape({
    type: PropTypes.oneOf([
      ...Object.keys(BUILT_IN_NETWORKS),
      NETWORK_TYPES.RPC,
    ]),
    nickname: PropTypes.string,
  }),
  /**
   * Whether the NetworkDisplay is disabled
   */
  disabled: PropTypes.bool,
  /**
   * The onClick event handler of the NetworkDisplay
   * if it is not passed it is assumed that the NetworkDisplay
   * should not be interactive and removes the caret and changes the border color
   * of the NetworkDisplay
   */
  onClick: PropTypes.func,
};
