import * as request from "superagent"
export default (opts)=>{
  // console.info("request:", opts.uri)

  opts.uri = encodeURI(opts.uri)
  let req = request(opts.method || "GET", opts.uri)
  opts.headers = opts.headers || {}
  opts.gzip && req.set('Accept-Encoding', 'gzip, deflate')

  opts.formData && req.send(opts.formData)
  opts.uri.query && req.query(opts.uri.query)
  opts.accept && req.accept(opts.accept)
  opts.cors && req.withCredentials()
  opts.auth && req.auth(opts.auth.user, opts.auth.pwd)
  let buffer = []
  req.set("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36")
  req.on('request', (chunk)=>{
    buffer.push(chunk)
  })

  req.on('end', (response)=>{
    if(opts.encoding) {
      let encoding = chrset(response, buffer)
      encoding = encoding || jschardet.detect(buffer).encoding
      if(enocding) {
        console.info("Detecd charset", encoding)
        if(['ascii', 'urf'].include(encoding)) {
          res.text = buffer.toString()
        } else {
          iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE')
          req.text = iconv.convert(buffer).toString()
        }
      }
    }
  })

  for(let [hk, hv] in (opts.attachs || {})) {
    req.attach(hk, hv)
  }
  //for(let [hk, hv] in opts.headers) {
  //  req.set(hk, hv)
  //}
  return req
}
