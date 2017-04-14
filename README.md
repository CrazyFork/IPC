## 
fork 自 git@github.com:YanagiEiichi/SocketIPC.git

用socket实现了一个IPC(inter process communication), 类似Remote Procedure Call。






# SocketIPC

Implements IPC with Socket on cluster mode

### Demo

```js
const cluster = require('cluster');
const assert = require('assert');
const { call, registerMaster } = require('..');

if (cluster.isMaster) {

  registerMaster({

    sum(params) {
      return params.reduce((a, b) => a + b, 0);
    },

    exit(code) {
      process.exit(code);
    }

  });

  cluster.fork();

} else {

  call('sum', [ 1, 2, 3, 4 ]).then(result => {

    assert.equal(result, 10);
    call('exit', 0);

  }).catch(error => {

    console.error(error);
    call('exit', 1);

  });

}
```
