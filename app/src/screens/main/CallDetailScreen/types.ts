import { CallLog } from '../../../types';

export interface CallDetailScreenProps {
  route: {
    params: {
      call: CallLog;
    };
  };
  navigation: any;
}
