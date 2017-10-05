(function(wnd) {
  var socket = io('http://localhost:3080');
  socket.on('connect', function(){
    console.log('connect')

    socket.on('jsonData', function (data) {
      console.log($('.stats'))
      $('.js-overview-chart').overviewChartWidget(data.payload);
    });
  });

  socket.on('event', function(data){});

  socket.on('disconnect', function(){});
}(window));
