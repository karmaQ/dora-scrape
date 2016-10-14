class Stat {
  // get_value(key, default=None)
  // 返回指定key的统计值，如果key不存在则返回缺省值。

  get_stats()
  // 以dict形式返回当前spider的所有统计值。

  set_value(key, value)
  // 设置key所指定的统计值为value。

  set_stats(stats)
  // 使用dict形式的 stats 参数覆盖当前的统计值。

  inc_value(key, count=1, start=0)
  // 增加key所对应的统计值，增长值由count指定。 如果key未设置，则使用start的值设置为初始值。

  max_value(key, value)
  // 如果key所对应的当前value小于参数所指定的value，则设置value。 如果没有key所对应的value，设置value。

  min_value(key, value)
  // 如果key所对应的当前value大于参数所指定的value，则设置value。 如果没有key所对应的value，设置value。

  uniqPush()

  clear_stats()
  // 清除所有统计信息。

}

export default (scrape)=> {
  if(scrape.$isStats) { return }
  scrape.stats = {}
  scrape.$isStat = true
}