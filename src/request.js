import * as request from "request"
import { Iconv } from "iconv"
import * as charset from 'charset'
import * as jschardet from 'jschardet'
import { includes } from 'lodash'
export default async (opts)=>{
  console.info("request:", opts.uri)
  opts.uri = encodeURI(opts.uri)
  // return new Promise((resolve,reject)=>{
  //   return request.get(opts.uri).then(resolve).catch(reject)
  // })
  let text = await new Promise(function(resolve, reject) {
    request({
      method: 'GET',
      uri: opts.uri,
      timeout: 6000,
      encoding: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
      }
      }, function(err, res, body){
        if(err) {
          reject(err)
        } else {
          let result, buffer = body
          let encoding = charset(res, buffer)
          encoding = encoding || jschardet.detect(buffer).encoding
          // var result = iconv.decode(bufferHelper.toBuffer(),'GBK');
          if(encoding) {
            console.info("Detecd charset", encoding)
            if(includes(['ascii', 'urf'], encoding)) {
              res.text = buffer.toString()
            } else {
              let iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE')
              res.text = iconv.convert(buffer).toString()
            }
          }
          resolve(res.text)
        }
      })
  })
  // .on('response', function(res, err) {
    
  //   let buffer = []//new BufferHelper();
  //   res.on('data', function (chunk) {
  //     buffer.push(chunk);
  //   });
  //   res.on('end',function(){
  //     let result
  //     let encoding = charset(res, buffer)
  //     encoding = encoding || jschardet.detect(buffer).encoding
  //     // var result = iconv.decode(bufferHelper.toBuffer(),'GBK');
  //     if(encoding) {
  //       console.info("Detecd charset", encoding)
  //       if(includes(['ascii', 'urf'],encoding)) {
  //         res.text = buffer.toString()
  //       } else {
  //         let iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE')
  //         result = iconv.convert(buffer).toString()
  //       }
  //     }
  //     console.log('decoded chunk: ' + result)
      
  //     return result
  //   })
    // decompressed data as it is received
  // })

  return {
    text: text
  }
}
