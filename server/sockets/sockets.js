module.exports = io => {
  let people = {};
  let rooms = {};
  let sockets = [];
  let history = {};

  io.sockets.on("connection", socket => {
    socket.on('peerId', (id) => {
      people[socket.id] = {
        peerId: id,
        color: getRandomColor()
      };
      socket.emit('update-people', people)
    })

    socket.on('disconnect', () => {
      delete people[socket.id];
      io.sockets.emit("update-people", people);
    })
  })

  socket.on('message', (message) => {
    socket.emit('message', message)
  })
}

getRandomColor = ranges => {
  if (!ranges) {
    ranges = [[150, 256], [0, 190], [0, 190]];
  }
  let g = function() {
    //select random range and remove
    let range = ranges.splice(Math.floor(Math.random() * ranges.length), 1)[0];
    //pick a random number from within the range
    return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
  };
  color = "rgb(" + g() + "," + g() + "," + g() + ")";
  return color;
};