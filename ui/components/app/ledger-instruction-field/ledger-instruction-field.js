import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
  HardwareTransportStates,
  LEDGER_USB_VENDOR_ID,
} from '../../../../shared/constants/hardware-wallets';

import {
  setLedgerWebHidConnectedStatus,
  getLedgerWebHidConnectedStatus,
  setLedgerTransportStatus,
  getLedgerTransportStatus,
} from '../../../ducks/app/app';

import { getLedgerTransportType } from '../../../ducks/metamask/metamask';
import { attemptLedgerTransportCreation } from '../../../store/actions';

export default function LedgerInstructionField() {
  const dispatch = useDispatch();

  const webHidConnectedStatus = useSelector(getLedgerWebHidConnectedStatus);
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const transportStatus = useSelector(getLedgerTransportStatus);

  useEffect(() => {
    const initialConnectedDeviceCheck = async () => {
      if (
        ledgerTransportType === LedgerTransportTypes.webhid &&
        webHidConnectedStatus !== WebHIDConnectedStatuses.connected
      ) {
        const devices = await window.navigator?.hid?.getDevices();
        const webHidIsConnected = devices?.some(
          (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
        );
        dispatch(
          setLedgerWebHidConnectedStatus(
            webHidIsConnected
              ? WebHIDConnectedStatuses.connected
              : WebHIDConnectedStatuses.notConnected,
          ),
        );
      }
    };
    const determineTransportStatus = async () => {
      if (
        ledgerTransportType === LedgerTransportTypes.webhid &&
        webHidConnectedStatus === WebHIDConnectedStatuses.connected &&
        transportStatus === HardwareTransportStates.none
      ) {
        try {
          const transportedCreated = await attemptLedgerTransportCreation();
          dispatch(
            setLedgerTransportStatus(
              transportedCreated
                ? HardwareTransportStates.verified
                : HardwareTransportStates.unknownFailure,
            ),
          );
        } catch (e) {
          if (e.message.match('Failed to open the device')) {
            dispatch(
              setLedgerTransportStatus(
                HardwareTransportStates.deviceOpenFailure,
              ),
            );
          } else if (e.message.match('the device is already open')) {
            dispatch(
              setLedgerTransportStatus(HardwareTransportStates.verified),
            );
          } else {
            dispatch(
              setLedgerTransportStatus(HardwareTransportStates.unknownFailure),
            );
          }
        }
      }
    };
    determineTransportStatus();
    initialConnectedDeviceCheck();
  }, [dispatch, ledgerTransportType, webHidConnectedStatus, transportStatus]);

  useEffect(() => {
    return () => {
      dispatch(setLedgerTransportStatus(HardwareTransportStates.none));
    };
  }, [dispatch]);

  return null;
}
