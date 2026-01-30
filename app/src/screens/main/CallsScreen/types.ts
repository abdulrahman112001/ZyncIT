import { CallLog } from '../../../../types';

export interface GroupedCall {
  key: string;
  contactName: string;
  phoneNumber: string;
  lastType: CallLog['type'];
  lastTimestamp: number;
  lastDuration: number;
  count: number;
  calls: CallLog[];
}
