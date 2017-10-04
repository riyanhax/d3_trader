(function(wnd, doc, acc) {
  var formatNumber = function(number, sign, precision) {
    if (toString.call(number) === '[object String]') {
      number = parseFloat(number);
    }
    if (toString.call(number) !== '[object Number]') {
      number = 'NA';
    }
    if (number !== +number) { // isNaN
      number = 'NA';
    }

    number = Number(number.toString().match(new RegExp("^\\d+(?:\\.\\d{0," + precision + "})?")));
    return acc.formatMoney(number, {
      symbol: sign,
      format: "%s%v",
      precision: precision
    });
  };

  function create(conf) {
    return {
      slug: function() {
        return conf.slug;
      },

      currency_base: function() {
        return conf.slug.split('-')[0].toUpperCase();
      },

      currency_base: function() {
        return conf.slug.split('-')[1].toUpperCase();
      },

      currency_pair: function() {
        return conf.slug.replace('-', '/').toUpperCase();
      },

      fmt_number: formatNumber,

      fmt_base: function(number, precision) {
        return formatNumber(number, conf.sign.base, precision || conf.precision.base);
      },

      fmt_quote: function(number, precision) {
        return formatNumber(number, conf.sign.quote, precision || conf.precision.quote);
      },

      fmt_price: function(number, precision) {
        return formatNumber(number, conf.sign.quote, precision || conf.precision.price);
      }
    };
  }

  // export market create function
  wnd.createMarket = create;
  // export global market
  wnd.market = create(JSON.parse(doc.body.getAttribute("data-market-info")));
}(window, document, accounting));
