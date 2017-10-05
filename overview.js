(function($, wnd) {

  var period = 1

  /**
   * Makes an array of month data slices
   * so it can be sliced
   */
  var extract = function(candlestick, json) {
    var data = {
      1: [],
      3: [],
      6: [],
      12: [],
      36: [],
      "ytd": [],
      "all": []
    };
    var item, parse = d3.time.format("%Y-%m-%d").parse;
    var i = 0;
    var ytd = false; // hits true when Jan is found
    for (dt in json) {
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
    
    // data.map(function(d) {
    //   return {
    //     date: parseDate(d.Date),
    //     open: +d.Open,
    //     high: +d.High,
    //     low: +d.Low,
    //     close: +d.Close,
    //     volume: +d.Volume
    //   };
    // }).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });
    return data[period];
  };

  var OverviewChart = function(el, jsonData) {
    var dim = {
        width: 960, height: 500,
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

    var indicatorTop = d3.scale.linear()
      .range([dim.indicator.top, dim.indicator.bottom]); // интервал значений по оси

    var parseDate = d3.time.format("%d-%b-%y").parse;

    var zoom = d3.zoom()
      .on("zoom", zoomed);

    var x = techan.scale.financetime()
      .range([0, dim.plot.width]);

    var y = d3.scale.linear()
      .range([dim.ohlc.height, 0]);

    // var yPercent = y.copy();   // Same as y at this stage, will get a different domain later

    var yInit, yPercentInit, zoomableInit;

    var yVolume = d3.scale.linear()
      .range([y(0), y(0.2)]);

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

    var yAxis = d3.axisRight(y);

    var ohlcAnnotation = techan.plot.axisannotation()
      .axis(yAxis)
      .orient('left')
      .format(d3.format(',.2f'))
      .translate([x(1), 0]);

    var closeAnnotation = techan.plot.axisannotation()
      .axis(yAxis)
      .orient('right')
      .accessor(candlestick.accessor())
      .format(d3.format(',.2f'))
      .translate([x(1), 0]);

    // var percentAxis = d3.axisLeft(yPercent)
    //         .tickFormat(d3.format('+.1%'));

    // var percentAnnotation = techan.plot.axisannotation()
    //         .axis(percentAxis)

    var volumeAxis = d3.axisRight(yVolume)
            .ticks(3)
            .tickFormat(d3.format(",.3s"));

    var volumeAnnotation = techan.plot.axisannotation()
            .axis(volumeAxis)
            .orient("right")
            .width(35);

    var macdScale = d3.scale.linear()
            .range([indicatorTop(0)+dim.indicator.height, indicatorTop(0)]);

    var rsiScale = macdScale.copy()
            .range([indicatorTop(1)+dim.indicator.height, indicatorTop(1)]);

    var macd = techan.plot.macd()
            .xScale(x)
            .yScale(macdScale);

    var macdAxis = d3.axisRight(macdScale)
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
            .attr("clip-path", "url(#ohlcClip)");

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

    var data = extract(candlestick, jsonData)

    console.log(techan.scale.plot.time(data).domain())
    x.domain(techan.scale.plot.time(data).domain());
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());
    // yPercent.domain(techan.scale.plot.percent(y, accessor(data[indicatorPreRoll])).domain());
    yVolume.domain(techan.scale.plot.volume(data).domain());

        var trendlineData = [
            { start: { date: new Date(2014, 2, 11), value: 72.50 }, end: { date: new Date(2014, 5, 9), value: 63.34 } },
            { start: { date: new Date(2013, 10, 21), value: 43 }, end: { date: new Date(2014, 2, 17), value: 70.50 } }
        ];

        var supstanceData = [
            { start: new Date(2014, 2, 11), end: new Date(2014, 5, 9), value: 63.64 },
            { start: new Date(2013, 10, 21), end: new Date(2014, 2, 17), value: 55.50 }
        ];

        var trades = [
            { date: data[13].date, type: "buy", price: data[13].low, low: data[13].low, high: data[13].high },
            { date: data[16].date, type: "sell", price: data[16].high, low: data[16].low, high: data[16].high },
            { date: data[20].date, type: "buy", price: data[20].low, low: data[20].low, high: data[20].high },
            { date: data[25].date, type: "sell", price: data[25].low, low: data[25].low, high: data[25].high }
        ];

        var macdData = techan.indicator.macd()(data);
        macdScale.domain(techan.scale.plot.macd(macdData).domain());
        var rsiData = techan.indicator.rsi()(data);
        rsiScale.domain(techan.scale.plot.rsi(rsiData).domain());

        svg.select("g.candlestick").datum(data).call(candlestick);
        svg.select("g.close.annotation").datum([data[data.length-1]]).call(closeAnnotation);
        svg.select("g.volume").datum(data).call(volume);
        // svg.select("g.sma.ma-0").datum(techan.indicator.sma().period(10)(data)).call(sma0);
        // svg.select("g.sma.ma-1").datum(techan.indicator.sma().period(20)(data)).call(sma1);
        // svg.select("g.ema.ma-2").datum(techan.indicator.ema().period(50)(data)).call(ema2);
        svg.select("g.macd .indicator-plot").datum(macdData).call(macd);
        svg.select("g.rsi .indicator-plot").datum(rsiData).call(rsi);

        svg.select("g.crosshair.ohlc").call(ohlcCrosshair).call(zoom);
        svg.select("g.crosshair.macd").call(macdCrosshair).call(zoom);
        svg.select("g.crosshair.rsi").call(rsiCrosshair).call(zoom);
        svg.select("g.trendlines").datum(trendlineData).call(trendline).call(trendline.drag);
        svg.select("g.supstances").datum(supstanceData).call(supstance).call(supstance.drag);

        // svg.select("g.tradearrow").datum(trades).call(tradearrow);

        // Stash for zooming
        zoomableInit = x.zoomable().domain([indicatorPreRoll, data.length]).copy(); // Zoom in a little to hide indicator preroll
        yInit = y.copy();
        // yPercentInit = yPercent.copy();

        draw();
    // d3.select("button").on("click", reset);
    function draw() {
      svg.select("g.x.axis").call(xAxis);
      svg.select("g.ohlc .axis").call(yAxis);
      svg.select("g.volume.axis").call(volumeAxis);
      // svg.select("g.percent.axis").call(percentAxis);
      svg.select("g.macd .axis.right").call(macdAxis);
      svg.select("g.rsi .axis.right").call(rsiAxis);
      svg.select("g.macd .axis.left").call(macdAxisLeft);
      svg.select("g.rsi .axis.left").call(rsiAxisLeft);

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
      // yPercent.domain(d3.event.transform.rescaleY(yPercentInit).domain());

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
        var lis = el.find('li');
        lis.find('a').on('click', function (e) {
          e.preventDefault();
          period = $(this).data('period')
          console.log()
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
