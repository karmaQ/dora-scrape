import Router from './v2/dispatcher/router'
import Lexer from './v2/dispatcher/lexer'

let r = new Router(/news\/([0-9]+)$/, function(x){
  console.log('x:', x)
}, 0, {
  lexer: new Lexer
})
console.log(r.match('/news/123123'))
r.matched.dispatch.apply(r.matched, r.getParamsArray('news/123123'))