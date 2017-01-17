class Dispatcher {
  constructor(pattern, callback, prioity, router) {
    let isRegexPattern = isRegExp(pattern)
    let lexer = router.lexer
    this.router = router
    this.pattern = pattern
  }
}