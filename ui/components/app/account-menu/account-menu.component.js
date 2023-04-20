import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import classnames from 'classnames';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import Identicon from '../../ui/identicon';
import SiteIcon from '../../ui/site-icon';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { PRIMARY } from '../../../helpers/constants/common';
import {
  SETTINGS_ROUTE,
  NEW_ACCOUNT_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  NOTIFICATIONS_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/routes';
import TextField from '../../ui/text-field';

import SearchIcon from '../../ui/icon/search-icon';
import { IconColor } from '../../../helpers/constants/design-system';
import { Icon, IconName, IconSize } from '../../component-library';
import KeyRingLabel from './keyring-label';

export function AccountMenuItem(props) {
  const { icon, children, text, subText, className, onClick } = props;

  const itemClassName = classnames('account-menu__item', className, {
    'account-menu__item--clickable': Boolean(onClick),
  });
  return children ? (
    <div className={itemClassName} onClick={onClick}>
      {children}
    </div>
  ) : (
    <button className={itemClassName} onClick={onClick}>
      {icon ? <div className="account-menu__item__icon">{icon}</div> : null}
      {text ? <div className="account-menu__item__text">{text}</div> : null}
      {subText ? (
        <div className="account-menu__item__subtext">{subText}</div>
      ) : null}
    </button>
  );
}

AccountMenuItem.propTypes = {
  icon: PropTypes.node,
  children: PropTypes.node,
  text: PropTypes.node,
  subText: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default class AccountMenu extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    shouldShowAccountsSearch: PropTypes.bool,
    accounts: PropTypes.array,
    history: PropTypes.object,
    isAccountMenuOpen: PropTypes.bool,
    keyrings: PropTypes.array,
    selectedAddress: PropTypes.string,
    setSelectedAccount: PropTypes.func,
    toggleAccountMenu: PropTypes.func,
    addressConnectedSubjectMap: PropTypes.object,
    originOfCurrentTab: PropTypes.string,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    unreadNotificationsCount: PropTypes.number,
    ///: END:ONLY_INCLUDE_IN
  };

  accountsRef;

  state = {
    searchQuery: '',
  };

  addressFuse = new Fuse([], {
    threshold: 0.55,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    ignoreFieldNorm: true,
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'address', weight: 0.5 },
    ],
  });

  componentDidUpdate(prevProps) {
    const { isAccountMenuOpen: prevIsAccountMenuOpen } = prevProps;
    const { isAccountMenuOpen } = this.props;

    if (!prevIsAccountMenuOpen && isAccountMenuOpen) {
      this.resetSearchQuery();
    }
  }

  renderAccountsSearch() {
    const handleChange = (e) => {
      const val = e.target.value.length > 1 ? e.target.value : '';
      this.setSearchQuery(val);
    };

    const inputAdornment = (
      <InputAdornment
        position="start"
        style={{
          maxHeight: 'none',
          marginRight: 0,
          marginLeft: '8px',
        }}
      >
        <SearchIcon color="var(--color-icon-muted)" />
      </InputAdornment>
    );

    return [
      <TextField
        key="search-text-field"
        id="search-accounts"
        placeholder={this.context.t('searchAccounts')}
        type="text"
        onChange={handleChange}
        startAdornment={inputAdornment}
        fullWidth
        theme="material-white-padded"
      />,
      <div className="account-menu__divider" key="search-divider" />,
    ];
  }

  renderAccounts() {
    const {
      accounts,
      selectedAddress,
      keyrings,
      setSelectedAccount,
      addressConnectedSubjectMap,
      originOfCurrentTab,
    } = this.props;
    const { searchQuery } = this.state;

    let filteredIdentities = accounts;
    if (searchQuery) {
      this.addressFuse.setCollection(accounts);
      filteredIdentities = this.addressFuse.search(searchQuery);
    }

    if (filteredIdentities.length === 0) {
      return (
        <p className="account-menu__no-accounts">
          {this.context.t('noAccountsFound')}
        </p>
      );
    }

    return filteredIdentities.map((identity) => {
      const isSelected = identity.address === selectedAddress;

      const simpleAddress = identity.address.substring(2).toLowerCase();

      const keyring = keyrings.find((kr) => {
        return (
          kr.accounts.includes(simpleAddress) ||
          kr.accounts.includes(identity.address)
        );
      });
      const addressSubjects =
        addressConnectedSubjectMap[identity.address] || {};
      const iconAndNameForOpenSubject = addressSubjects[originOfCurrentTab];

      return (
        <button
          className="account-menu__account account-menu__item--clickable"
          onClick={() => setSelectedAccount(identity.address)}
          key={identity.address}
          data-testid="account-menu__account"
        >
          <div className="account-menu__check-mark">
            {isSelected ? (
              <Icon
                color={IconColor.successDefault}
                name={IconName.Check}
                size={IconSize.Lg}
              />
            ) : null}
          </div>
          <Identicon address={identity.address} diameter={24} />
          <div className="account-menu__account-info">
            <div className="account-menu__name">{identity.name || ''}</div>
            <UserPreferencedCurrencyDisplay
              className="account-menu__balance"
              data-testid="account-menu__balance"
              value={identity.balance}
              type={PRIMARY}
            />
          </div>
          <KeyRingLabel keyring={keyring} />
          {iconAndNameForOpenSubject ? (
            <div className="account-menu__icon-list">
              <SiteIcon
                icon={iconAndNameForOpenSubject.icon}
                name={iconAndNameForOpenSubject.name}
                size={32}
              />
            </div>
          ) : null}
        </button>
      );
    });
  }

  resetSearchQuery() {
    this.setSearchQuery('');
  }

  setSearchQuery(searchQuery) {
    this.setState({ searchQuery });
  }

  render() {
    const { t } = this.context;
    const {
      shouldShowAccountsSearch,
      isAccountMenuOpen,
      toggleAccountMenu,
      history,
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      unreadNotificationsCount,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    if (!isAccountMenuOpen) {
      return null;
    }

    return (
      <div className="account-menu">
        <div className="account-menu__close-area" onClick={toggleAccountMenu} />
        <div className="account-menu__accounts-container">
          {shouldShowAccountsSearch ? this.renderAccountsSearch() : null}
          <div
            className="account-menu__accounts"
            ref={(ref) => {
              this.accountsRef = ref;
            }}
          >
            {this.renderAccounts()}
          </div>
        </div>
        <div className="account-menu__divider" />
        <AccountMenuItem
          onClick={() => {
            toggleAccountMenu();
            history.push(NEW_ACCOUNT_ROUTE);
          }}
          icon={<Icon name={IconName.Add} color={IconColor.iconAlternative} />}
          text={t('createAccount')}
        />
        <AccountMenuItem
          onClick={() => {
            toggleAccountMenu();
            history.push(IMPORT_ACCOUNT_ROUTE);
          }}
          icon={
            <Icon name={IconName.Import} color={IconColor.iconAlternative} />
          }
          text={t('importAccount')}
        />
        <AccountMenuItem
          onClick={() => {
            toggleAccountMenu();
            if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
              global.platform.openExtensionInBrowser(CONNECT_HARDWARE_ROUTE);
            } else {
              history.push(CONNECT_HARDWARE_ROUTE);
            }
          }}
          icon={
            <Icon name={IconName.Hardware} color={IconColor.iconAlternative} />
          }
          text={t('connectHardwareWallet')}
        />
        {
          ///: BEGIN:ONLY_INCLUDE_IN(flask)
          <AccountMenuItem
            onClick={() => {
              toggleAccountMenu();
              history.push(NOTIFICATIONS_ROUTE);
            }}
            icon={
              <div className="account-menu__notifications">
                <Icon name={IconName.Notification} size={IconSize.Lg} />
                {unreadNotificationsCount > 0 && (
                  <div className="account-menu__notifications__count">
                    {unreadNotificationsCount}
                  </div>
                )}
              </div>
            }
            text={t('notifications')}
          />
          ///: END:ONLY_INCLUDE_IN
        }

        <AccountMenuItem
          onClick={() => {
            toggleAccountMenu();
            history.push(SETTINGS_ROUTE);
          }}
          icon={
            <Icon
              name={IconName.Setting}
              color={IconColor.iconAlternative}
              ariaLabel={t('settings')}
            />
          }
          text={t('settings')}
        />
      </div>
    );
  }
}
