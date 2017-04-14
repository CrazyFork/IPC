// build handlers to koa style middleware
exports.buildChains = (...handlers) => {
  return function callee(that, ctx, index = 0) {
    if (!(index < handlers.length)) return null;
    let handler = handlers[index];
    if (typeof handler !== 'function') return callee(that, ctx, index + 1);//skip current one
    return handler.call(that, ctx, () => callee(that, ctx, index + 1)); //that, ctx,  next
  };
};
