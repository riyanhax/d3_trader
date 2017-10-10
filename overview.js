import * as d3 from 'd3'
import * as techan from 'techan'

(function($, wnd) {

  var jsonData = {
      '2017-09-06': [62.40, 63.34, 61.79, 62.88, 30],
      '2017-09-07': [63.37, 63.48, 62.15, 62.50, 33],
      '2017-09-08': [63.66, 64.36, 62.82, 63.19, 33],
      '2017-09-09': [62.45, 63.59, 62.07, 63.34, 33],
      '2017-09-10': [62.62, 63.42, 62.32, 62.87, 34],
      '2017-09-11': [63.23, 63.59, 62.05, 63.08, 34],
      '2017-09-12': [63.95, 64.17, 62.56, 63.30, 35],
      '2017-09-13': [63.84, 64.30, 63.51, 63.83, 36],
      '2017-09-14': [63.39, 64.14, 62.62, 63.51, 36],
      '2017-09-15': [61.62, 63.51, 61.57, 63.48, 36],
      '2017-09-16': [60.41, 61.45, 60.15, 61.35, 36],
      '2017-09-17': [60.94, 61.48, 60.40, 60.52, 36],
      '2017-09-18': [58.56, 60.50, 58.25, 60.49, 36],
      '2017-09-19': [59.50, 60.19, 58.18, 58.56, 37],
      '2017-09-20': [57.89, 59.56, 57.57, 59.21, 37],
      '2017-09-21': [58.31, 58.45, 57.31, 58.02, 37],
      '2017-09-22': [59.26, 59.38, 57.52, 57.92, 34],
      '2017-09-23': [59.53, 60.45, 58.95, 59.23, 34],
      '2017-09-24': [59.66, 60.89, 59.51, 59.83, 33],
      '2017-09-25': [57.98, 59.90, 57.98, 59.83, 37],
      '2017-09-26': [56.85, 57.65, 56.38, 57.24, 37],
      '2017-09-27': [57.23, 58.82, 56.50, 56.76, 38],
      '2017-09-28': [58.77, 59.30, 56.26, 57.39, 38],
      '2017-09-29': [60.98, 61.15, 58.49, 58.53, 38],
      '2017-09-30': [59.67, 61.35, 59.18, 61.22, 38],
      '2017-10-01': [60.43, 62.28, 60.21, 61.15, 41],
      '2017-10-02': [57.58, 59.85, 57.16, 59.78, 41.3],
      '2017-10-03': [56.09, 58.28, 55.84, 58.15, 41.6],
      '2017-10-04': [58.05, 58.31, 54.66, 56.14, 42.3]
    }
  /**
   * Makes an array of month data slices
   * so it can be sliced
   */
  var extract = function(el, json) {
    if (!json) {
      json = jsonData
    }

    var data = {
      1: [],
      3: [],
      6: [],
      12: [],
      36: [],
      "ytd": [],
      "all": []
    };
    var item, parse = d3.timeParse("%Y-%m-%d");
    var i = 0;
    var ytd = false; // hits true when Jan is found
    for (let dt in json) {
      if (json.hasOwnProperty(dt)) {
        item = {
          date: parse(dt),
          open: json[dt][0],
          high: json[dt][1],
          low: json[dt][2],
          close: json[dt][3],
          volume: json[dt][4]
        };

        ytd = true;

        // check for YTD
        if (!ytd && 0 === item.date.getMonth()) {
          ytd = true;
        }

        // add month
        if (i < 30) {
          data[1].push(item);
        }
        // add 3 month
        if (i < 90) {
          data[3].unshift(item);
        }
        // add 6 month
        if (i < 180) {
          data[6].unshift(item);
        }
        // add 12 month
        if (i < 360) {
          data[12].unshift(item);
        }
        // add 36 month
        if (i < 1080) {
          data[36].unshift(item);
        }
        // add to YTD
        if (!ytd) {
          data["ytd"].unshift(item);
        }
        // all data list
        data["all"].unshift(item);
        i++;
      }
    }
    console.log(el.data('period'))
    var period = el.data('period')

    return data[period];
  };

  var OverviewChart = function(el, jsonData) {
    const width = window.innerWidth
    var dim = {
        width: width, height: 500,
        margin: { top: 20, right: 50, bottom: 30, left: 50 },
        ohlc: { height: 305 },
        indicator: { height: 65, padding: 5 }
    };
    dim.plot = {
        width: dim.width - dim.margin.left - dim.margin.right,
        height: dim.height - dim.margin.top - dim.margin.bottom
    };
    dim.indicator.top = dim.ohlc.height+dim.indicator.padding;
    dim.indicator.bottom = dim.indicator.top+dim.indicator.height+dim.indicator.padding;

    var indicatorTop = d3.scaleLinear()
      .range([dim.indicator.top, dim.indicator.bottom]); // интервал значений по оси

    var parseDate = d3.timeParse("%d-%b-%y");

    var zoom = d3.zoom()
      .on("zoom", zoomed);

    var x = techan.scale.financetime()
      .range([0, dim.plot.width]);

    var y = d3.scaleLinear()
      .range([dim.ohlc.height, 0]);

    // var yPercent = y.copy();   // Same as y at this stage, will get a different domain later

    var yInit, zoomableInit;

    var yVolume = d3.scaleLinear()
      .range([y(0), y(0.1)]);

      var candlestick = techan.plot.candlestick()
      .xScale(x)
      .yScale(y);

    var volume = techan.plot.volume()
      .accessor(candlestick.accessor())   // Set the accessor to a ohlc accessor so we get highlighted bars
      .xScale(x)
      .yScale(yVolume);

    var trendline = techan.plot.trendline()
      .xScale(x)
      .yScale(y);

    var supstance = techan.plot.supstance()
      .xScale(x)
      .yScale(y);

    var xAxis = d3.axisBottom(x);

    var timeAnnotation = techan.plot.axisannotation()
      .axis(xAxis)
      .orient('bottom')
      .format(d3.timeFormat('%Y-%m-%d'))
      .width(65)
      .translate([0, dim.plot.height]);
// координатная ось цен
    var yAxis = d3.axisLeft(y)
        .ticks(4)

    var ohlcAnnotation = techan.plot.axisannotation()
      .axis(yAxis)
      .orient('left')
      .format(d3.format(',.2f'))
      .translate([0, 0]);

// медиана
    var closeAnnotation = techan.plot.axisannotation()
      .axis(yAxis)
      .orient('left')
      .accessor(candlestick.accessor())
      .format(d3.format(',.2f'))
      .translate([0, 0]);

// координаты блочного графика
    var volumeAxis = d3.axisLeft(yVolume)
          .ticks(0)  // количество точек на координате
          .tickFormat(d3.format(",.3s"));

    var volumeAnnotation = techan.plot.axisannotation()
            .axis(volumeAxis)
            .orient("left")
            .width(35)
//
    var macdScale = d3.scaleLinear()
            .range([indicatorTop(0)+dim.indicator.height, indicatorTop(0)]);

    var rsiScale = macdScale.copy()
            .range([indicatorTop(1)+dim.indicator.height, indicatorTop(1)]);

    var macd = techan.plot.macd()
            .xScale(x)
            .yScale(macdScale);

    var macdAxis = d3.axisLeft(macdScale)
            .ticks(3);

    var macdAnnotation = techan.plot.axisannotation()
            .axis(macdAxis)
            .orient("right")
            .format(d3.format(',.2f'))
            .translate([x(1), 0]);

    var macdAxisLeft = d3.axisLeft(macdScale)
            .ticks(3);

    var macdAnnotationLeft = techan.plot.axisannotation()
            .axis(macdAxisLeft)
            .orient("left")
            .format(d3.format(',.2f'));

    var rsi = techan.plot.rsi()
            .xScale(x)
            .yScale(rsiScale);

    var rsiAxis = d3.axisRight(rsiScale)
            .ticks(3);

    var rsiAnnotation = techan.plot.axisannotation()
            .axis(rsiAxis)
            .orient("right")
            .format(d3.format(',.2f'))
            .translate([x(1), 0]);

    var rsiAxisLeft = d3.axisLeft(rsiScale)
            .ticks(3);

    var rsiAnnotationLeft = techan.plot.axisannotation()
            .axis(rsiAxisLeft)
            .orient("left")
            .format(d3.format(',.2f'));

    var ohlcCrosshair = techan.plot.crosshair()
            .xScale(timeAnnotation.axis().scale())
            .yScale(ohlcAnnotation.axis().scale())
            .xAnnotation(timeAnnotation)
            .yAnnotation([ohlcAnnotation, volumeAnnotation])
            .verticalWireRange([0, dim.plot.height]);

    var macdCrosshair = techan.plot.crosshair()
            .xScale(timeAnnotation.axis().scale())
            .yScale(macdAnnotation.axis().scale())
            .xAnnotation(timeAnnotation)
            .yAnnotation([macdAnnotation, macdAnnotationLeft])
            .verticalWireRange([0, dim.plot.height]);

    var rsiCrosshair = techan.plot.crosshair()
            .xScale(timeAnnotation.axis().scale())
            .yScale(rsiAnnotation.axis().scale())
            .xAnnotation(timeAnnotation)
            .yAnnotation([rsiAnnotation, rsiAnnotationLeft])
            .verticalWireRange([0, dim.plot.height]);

    // el.removeChild(el.firstChild);
    var parent = el[0]
    if (parent.firstChild) {
      parent.removeChild(parent.firstChild)
    }
    var svg = d3.select('.' + el[0].className).append("svg")
      .attr("width", dim.width)
      .attr("height", dim.height);

    var defs = svg.append("defs");

    defs.append("clipPath")
            .attr("id", "ohlcClip")
        .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", dim.plot.width)
            .attr("height", dim.ohlc.height);

    defs.selectAll("indicatorClip").data([0, 1])
        .enter()
            .append("clipPath")
            .attr("id", function(d, i) { return "indicatorClip-" + i; })
        .append("rect")
            .attr("x", 0)
            .attr("y", function(d, i) { return indicatorTop(i); })
            .attr("width", dim.plot.width)
            .attr("height", dim.indicator.height);

    svg = svg.append("g")
      .attr("transform", "translate(" + dim.margin.left + "," + dim.margin.top + ")");

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + dim.plot.height + ")");

    var ohlcSelection = svg.append("g")
      .attr("class", "ohlc")
      .attr("transform", "translate(0,0)");

    ohlcSelection.append("g")
      .attr("class", "axis")
    
    // x(1) = 860  x(0) = 0

    ohlcSelection.append("g")
            .attr("class", "close annotation up");

    ohlcSelection.append("g")
            .attr("class", "volume")
            .attr("clip-path", "url(#ohlcClip)");

    ohlcSelection.append("g")
      .attr("class", "candlestick")
      .attr("clip-path", "url(#ohlcClip)")

    candlestick
    // ohlcSelection.append("g")
    //         .attr("class", "percent axis");

    ohlcSelection.append("g")
            .attr("class", "volume axis");

    var indicatorSelection = svg.selectAll("svg > g.indicator").data(["macd", "rsi"]).enter()
             .append("g")
                .attr("class", function(d) { return d + " indicator"; });

    indicatorSelection.append("g")
            .attr("class", "axis left")
            // .attr("transform", "translate(" + x(1) + ",0)");

    indicatorSelection.append("g")
            .attr("class", "axis left")
            // .attr("transform", "translate(" + x(0) + ",0)");

    indicatorSelection.append("g")
            .attr("class", "indicator-plot")
            .attr("clip-path", function(d, i) { return "url(#indicatorClip-" + i + ")"; });

    // Add trendlines and other interactions last to be above zoom pane
    svg.append('g')
      .attr("class", "crosshair ohlc");

    svg.append('g')
      .attr("class", "crosshair macd");

    svg.append('g')
            .attr("class", "crosshair rsi");

    svg.append("g")
            .attr("class", "trendlines analysis")
            .attr("clip-path", "url(#ohlcClip)");
    svg.append("g")
            .attr("class", "supstances analysis")
            .attr("clip-path", "url(#ohlcClip)");
    
    var indicatorPreRoll = 0;  // Don't show where indicators don't have data
    var accessor = candlestick.accessor();

    var data = extract(el, jsonData)

    x.domain(techan.scale.plot.time(data).domain());
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());
    // yPercent.domain(techan.scale.plot.percent(y, accessor(data[indicatorPreRoll])).domain());
    yVolume.domain(techan.scale.plot.volume(data).domain());

        // var trendlineData = [
        //     { start: { date: new Date(2014, 2, 11), value: 72.50 }, end: { date: new Date(2014, 5, 9), value: 63.34 } },
        //     { start: { date: new Date(2013, 10, 21), value: 43 }, end: { date: new Date(2014, 2, 17), value: 70.50 } }
        // ];

        // var supstanceData = [
        //     { start: new Date(2014, 2, 11), end: new Date(2014, 5, 9), value: 63.64 },
        //     { start: new Date(2013, 10, 21), end: new Date(2014, 2, 17), value: 55.50 }
        // ];

        // var trades = [
        //     { date: data[13].date, type: "buy", price: data[13].low, low: data[13].low, high: data[13].high },
        //     { date: data[16].date, type: "sell", price: data[16].high, low: data[16].low, high: data[16].high },
        //     { date: data[20].date, type: "buy", price: data[20].low, low: data[20].low, high: data[20].high },
        //     { date: data[25].date, type: "sell", price: data[25].low, low: data[25].low, high: data[25].high }
        // ];

    var macdData = techan.indicator.macd()(data); // macdData = [] надо разобраться
    macdScale.domain(techan.scale.plot.macd(macdData).domain());
    var rsiData = techan.indicator.rsi()(data);
    rsiScale.domain(techan.scale.plot.rsi(rsiData).domain());

    svg.select("g.candlestick").datum(data).call(candlestick);
    svg.select("g.close.annotation").datum([data[Math.floor(data.length/2)]]).call(closeAnnotation);
    svg.select("g.volume").datum(data).call(volume);
    // svg.select("g.sma.ma-0").datum(techan.indicator.sma().period(10)(data)).call(sma0);
    // svg.select("g.sma.ma-1").datum(techan.indicator.sma().period(20)(data)).call(sma1);
    // svg.select("g.ema.ma-2").datum(techan.indicator.ema().period(50)(data)).call(ema2);
    svg.select("g.macd .indicator-plot").datum(macdData).call(macd);
    svg.select("g.rsi .indicator-plot").datum(rsiData).call(rsi);

    svg.select("g.crosshair.ohlc").call(ohlcCrosshair).call(zoom);
    svg.select("g.crosshair.macd").call(macdCrosshair).call(zoom);
    svg.select("g.crosshair.rsi").call(rsiCrosshair).call(zoom);
    // svg.select("g.trendlines").datum(trendlineData).call(trendline).call(trendline.drag);
    // svg.select("g.supstances").datum(supstanceData).call(supstance).call(supstance.drag);

    // svg.select("g.tradearrow").datum(trades).call(tradearrow);

    // Stash for zooming
    zoomableInit = x.zoomable().domain([indicatorPreRoll, data.length]).copy(); // Zoom in a little to hide indicator preroll
    yInit = y.copy();

    draw();
    // d3.select("button").on("click", reset);
    function draw() {
      svg.select("g.x.axis").call(xAxis);
      svg.select("g.ohlc .axis").call(yAxis);
      svg.select("g.volume.axis").call(volumeAxis);
      // svg.select("g.percent.axis").call(percentAxis);

  // из-за этого отваливался масшттаб граффика
      // svg.select("g.macd .axis.right").call(macdAxis);
      // svg.select("g.rsi .axis.right").call(rsiAxis);
      // svg.select("g.macd .axis.left").call(macdAxisLeft);
      // svg.select("g.rsi .axis.left").call(rsiAxisLeft);

      // We know the data does not change, a simple refresh that does not perform data joins will suffice.
      svg.select("g.candlestick").call(candlestick.refresh);
      svg.select("g.close.annotation").call(closeAnnotation.refresh);
      svg.select("g.volume").call(volume.refresh);
      // svg.select("g .sma.ma-0").call(sma0.refresh);
      // svg.select("g .sma.ma-1").call(sma1.refresh);
      // svg.select("g .ema.ma-2").call(ema2.refresh);
      svg.select("g.macd .indicator-plot").call(macd.refresh);
      svg.select("g.rsi .indicator-plot").call(rsi.refresh);
      svg.select("g.crosshair.ohlc").call(ohlcCrosshair.refresh);
      svg.select("g.crosshair.macd").call(macdCrosshair.refresh);
      svg.select("g.crosshair.rsi").call(rsiCrosshair.refresh);
      svg.select("g.trendlines").call(trendline.refresh);
      svg.select("g.supstances").call(supstance.refresh);
      // svg.select("g.tradearrow").call(tradearrow.refresh);
    }
    function zoomed() {
      x.zoomable().domain(d3.event.transform.rescaleX(zoomableInit).domain());
      y.domain(d3.event.transform.rescaleY(yInit).domain());

      draw();
    }

    return false;
  };


  $.fn.overviewChartWidget = function(jsonData) {
    return this.each(function() {
      if ($(this).data('stats') === undefined) {
        // setting instance so it can be mocked
        var el = $(this);
        var chart = OverviewChart(el, jsonData);

        el.data('stats', chart);

        // bind to period selector
        var lis = el.parent('.stats').find('ul');
        lis.on('click', 'a', function (e) {
          e.preventDefault();
          el.attr('data-period', $(e.target).data('period'))
          lis.removeClass('act');
          $(this).parent().addClass('act');
          // chart.draw($(this).data('period'));
        });
        // trigger default period draw
        lis.find('a[data-period="1"]').trigger('click');
      }
    });
  };

}(jQuery, window));

console.log($.fn)
$('.js-overview-chart').overviewChartWidget();

