const cluster = require('cluster');

class PidNotFoundError extends Error {
  constructor() {
    super('PID not found in SocketIPC');
    this.name = 'SOCKET_IPC_PID_NOT_FOUND';
    this.status = 400;
  }
}

if (cluster.isMaster) {

  const net = require('net');
  const Connection = require('./connection');
  const { buildChains } = require('./utils');
  const storage = new Map();//这个变量缓存了所有的客户端连接

  const __init = buildChains(function({ pid }) {
    storage.set(pid, this);
    this.socket.on('error', () => this.socket.destroy());
    this.socket.on('timeout', () => this.socket.destroy());//这个地方是不是应该delete下
    this.socket.on('close', () => storage.delete(pid));
  });

  // 客户端调用master的__broadcast的__broadcast是不是会出现栈溢出
  const __broadcast = buildChains(function({ args, ignores = [] }) {
    let results = [];
    storage.forEach((connection, pid) => {
      if (~ignores.indexOf(pid)) return;
      if (pid === process.pid && ~ignores.indexOf('master')) return;
      results.push(connection.call(...args));
    });
    let all = Promise.all(results);
    results.then = (...args) => all.then(...args);
    results.catch = (...args) => all.catch(...args);
    return results;
  });

  const __registerMaster = buildChains(function({ name, handlers }) {
    table[name] = buildChains(...[].concat(handlers));
  });

  const __callWorker = buildChains(function({ pid, args }) {
    for (let [ thisPid, connection ] of storage) {
      if (thisPid === pid) return connection.call(...args);
    }
    throw new PidNotFoundError();
  });

  // 所有的这些方法会mixin到相应的mastr Connection实例当中
  let table = { __init, __broadcast, __registerMaster, __callWorker };

  let server = net.createServer(socket => {
    void new Connection(socket, table);
  }).listen();// bm: grab a random port.

  server.unref();

  // 子进程会继承父进程的 env
  process.env.SOCKETIPC_ADDRESS = JSON.stringify(server.address());// server address returns: { port: 12346, family: 'IPv4', address: '127.0.0.1' }

  module.exports = table;

} else {

  module.exports = null;

}
