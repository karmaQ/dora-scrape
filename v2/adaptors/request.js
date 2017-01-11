import * as request from "request-promise"
export default async (opts)=>{
  console.info("request:", opts.uri)
  opts.uri = encodeURI(opts.uri)
  // return new Promise((resolve,reject)=>{
  //   return request.get(opts.uri).then(resolve).catch(reject)
  // })
  return {
    text: await request({
      method: 'GET',
      uri: opts.uri,
      timeout: 6000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
      }
    })
  }
}