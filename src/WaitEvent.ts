import { EventEmitter } from 'node:events'

export default class WaitEvent extends EventEmitter {
    constructor() {
        super();
    }
    wait(ev: string, timeout = -1): Promise<any> {
        return new Promise((r, j) => {
            let tid: NodeJS.Timeout | undefined = undefined;
            function listener(res: any) {
                if (tid !== undefined) clearTimeout(tid);
                r(res);
            }
            if (timeout >= 0) {
                tid = setTimeout(() => {
                    this.removeListener(ev, listener);
                    j(`Timed out waiting for '${ev}'`);
                }, timeout);
            }
            this.once(ev, r);
        })
    }
}