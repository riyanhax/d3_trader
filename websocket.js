(function(wnd) {
  var socket = io('http://localhost:3080');
  socket.on('connect', function(){
    console.log('connect')

    socket.on('jsonData', function (data) {
      var view = $('.js-overview-chart')
      view.overviewChartWidget(data.payload);

      socket.emit('fu', {
        type: 'period',
        payload: view.attr('data-period')
      })
    });

  });

  socket.on('event', function(data){});

  socket.on('disconnect', function(){});
}(window));
