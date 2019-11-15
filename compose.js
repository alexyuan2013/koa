function compose(middleware){

  return function(context, next) {
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        // fn(context, dispatch.bind(null, i + 1)) =>相当于(context, next)=>{}的中间件函数的调用，
        // 而此时next参数传入的为dispatch函数，即发生了递归调用，
        // 这样，中间件函数执行中，调用next函数，就会发生递归，继续调用dispatch函数，直到递归返回
        // 递归返回后，又回到上一层函数的现场，这里就是KOA洋葱圈模型的实现原理
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }

}

const myMiddleware = []
let count = 0;
let ctx = {};
myMiddleware.push((context, next)=>{context.mid1 = 1;console.log(count++); next();console.log("a")})
myMiddleware.push((context, next)=>{context.mid2 = 2;console.log(count++); next();console.log("b")})
myMiddleware.push((context, next)=>{context.mid3 = 3;console.log(count++); next();console.log("c")})

const fnMiddleware = compose(myMiddleware)

fnMiddleware(ctx).then(()=>console.log(ctx));
// 打印结果为：0, 1, 2, c, b, a, {mid1：1, mid2: 2, mid3: 3}
// 结果说明：ctx作为上下文对象，作为中间件执行的共享对象，相应的结果在中间件之间通过ctx进行传递
// 符合洋葱圈模型，每个中间件都会执行两次