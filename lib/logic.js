var bitbank = require("node-bitbankcc")
var hitbtc = require('node-hitbtc')

// *****************
// 設定 / Settings
// *****************
//const api = bitbank.privateApi();
const public_api = bitbank.publicApi()
const public_hitbtc_api = hitbtc.publicApi()
//const private_hitbtc_api = hitbtc.privateApi()

const first_min_base_amount = 0
const first_min_quote_amount = 0
const second_min_base_amount = 0
const second_min_quote_amount = 0

module.exports.trade = async function() {
  console.log("--- prepare to trade ---")
  const best_info = await get_best_prices()
  console.log(best_info)
  await order_execute(best_info)
};

get_best_prices = async () => {
  const first_book = await public_api.getDepth("bcc_btc").then(function(res) {
    return res
  })

  const second_book = await public_hitbtc_api.getOrderBook("BCHBTC").then((res) => {
    return res
  })

  return {
    "first_book": { "best_ask": { "price": first_book.asks[0][0], "volume": first_book.asks[0][1] }, best_bit: { "price": first_book.bids[0][0], "volume": first_book.bids[0][1] } },
    "second_book": { "best_ask": { "price": second_book.ask[0].price, "volume": second_book.ask[0].size }, best_bit: { "price": second_book.bid[0].price, "volume": second_book.bid[0].size } }
  }
}

order_execute = async (best_info) => {
  if (best_info.first_book.best_ask.price < best_info.second_book.best_bit.price) {
    //in case of first is low and second is high
    console.log('in case of first is low and second is high')
    if (best_info.first_book.best_ask.volume > best_info.second_book.best_bit.volume) {
      console.log(`smaller size is ${best_info.second_book.best_bit.volume}`)
    } else {
      console.log(`smaller size is ${best_info.first_book.best_ask.volume}`)
    }
  } else if (best_info.first_book.best_bit.price > best_info.second_book.best_ask.price) {
    //in case of first is high and second is low
    console.log('in case of first is high and second is low')
    if (best_info.first_book.best_bit.volume > best_info.second_book.best_ask.volume) {
      console.log(`smaller size is ${best_info.second_book.best_ask.volume}`)
    } else {
      console.log(`smaller size is ${best_info.first_book.best_bit.volume}`)
    }
  }

}
