import { hasAnchor } from '../types';
import type { AuthenticationNotice } from '../types';

export function partitionNotices(notices: AuthenticationNotice[], fieldKeys: string[] = []) {
    const firstKey = fieldKeys[0];
    const lastKey = fieldKeys[fieldKeys.length - 1];

    const noticesBefore = (fieldKey: string) =>
        notices.filter((n) => {
            if (hasAnchor(n)) return n.anchor === fieldKey;
            return (!n.position || n.position === 'top') && fieldKey === firstKey;
        });

    const noticesAfter = (fieldKey: string) =>
        notices.filter((n) => {
            if (hasAnchor(n)) return false;
            return n.position === 'bottom' && fieldKey === lastKey;
        });

    return { noticesBefore, noticesAfter };
}
