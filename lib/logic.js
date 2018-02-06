const bitbank = require("node-bitbankcc")
const hitbtc = require('node-hitbtc')
const task = require('promise-util-task');

// *****************
// 設定 / Settings
// *****************



const first_private_api = bitbank.privateApi(process.env.BITBANK_API_KEY, process.env.BITBANK_SECRET_KEY);
const first_public_api = bitbank.publicApi()
const second_public_api = hitbtc.publicApi()
const second_private_api = hitbtc.privateApi(process.env.HITBTC_API_KEY, process.env.HITBTC_SECRET_KEY)

const first_min_base_amount = 0
const first_min_quote_amount = 0
const second_min_base_amount = 0
const second_min_quote_amount = 0
const minimum_gap = 0.0003

module.exports.trade = async function() {
  console.log("--- prepare to trade ---")
  const best_info = await get_best_prices()
  console.log(best_info)
  await arbitrage_execute(best_info)
};

get_best_prices = async () => {
  const first_book = await first_public_api.getDepth("bcc_btc").then(function(res) {
    return res
  })

  const second_book = await second_public_api.getOrderBook("BCHBTC").then((res) => {
    return res
  })

  return {
    "first_book": { "best_ask": { "price": first_book.asks[0][0], "volume": first_book.asks[0][1] }, "best_bit": { "price": first_book.bids[0][0], "volume": first_book.bids[0][1] } },
    "second_book": { "best_ask": { "price": second_book.ask[0].price, "volume": second_book.ask[0].size }, "best_bit": { "price": second_book.bid[0].price, "volume": second_book.bid[0].size } }
  }
}

order_execute = async (buy_book, sell_book, buy_callback, sell_callback) => {
  //const volume = buy_book.best_ask.volume > sell_book.best_bit.volume ? sell_book.best_bit.volume : buy_book.best_ask.volume
  const volume = 0.02
  const price = (parseFloat(sell_book.best_bit.price) + parseFloat(buy_book.best_ask.price)) / 2
  console.log(`volume: ${volume} price: ${price}`)

  var tasklist = [
    function() { return buy_callback(price, volume) },
    function() { return sell_callback(price, volume) }
  ]

  return await task.seq(tasklist)
}

arbitrage_execute = async (best_info) => {
  if (best_info.first_book.best_ask.price + minimum_gap < best_info.second_book.best_bit.price) {
    //in case of first is low and second is high
    console.log('in case of first is low and second is high')
    if (best_info.first_book.best_ask.volume > best_info.second_book.best_bit.volume) {
      console.log(`smaller size is ${best_info.second_book.best_bit.volume}`)
    } else {
      console.log(`smaller size is ${best_info.first_book.best_ask.volume}`)
    }

    await order_execute(best_info.first_book, best_info.second_book, first_buy_callback, second_sell_callback)
  } else if (best_info.first_book.best_bit.price > best_info.second_book.best_ask.price + minimum_gap) {
    //in case of first is high and second is low
    console.log('in case of first is high and second is low')
    if (best_info.first_book.best_bit.volume > best_info.second_book.best_ask.volume) {
      console.log(`smaller size is ${best_info.second_book.best_ask.volume}`)
    } else {
      console.log(`smaller size is ${best_info.first_book.best_bit.volume}`)
    }

    await order_execute(best_info.second_book, best_info.first_book, second_buy_callback, first_sell_callback)
  }

}

first_buy_callback = (price, volume) => {
  return first_private_api.order("bcc_btc", price, volume, "buy", "limit")
}

first_sell_callback = (price, volume) => {
  return first_private_api.order("bcc_btc", price, volume, "sell", "limit")
}

second_buy_callback = (price, volume) => {
  return second_private_api.order("BCHBTC", price, volume, "buy")
}

second_sell_callback = (price, volume) => {
  return second_private_api.order("BCHBTC", price, volume, "sell")
}
