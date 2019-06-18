let sanitize = require("validator");
let _ = require("underscore")._;
let uuid = require("node-uuid");
let Room = require("../room.js");

module.exports = io => {

  let people = {};
  let rooms = {};
  let sockets = [];
  let history = {};
  let peerId;
  io.sockets.on("connection", socket => {


    socket.on('peerId', (id) => {
      peerId = id;
      let peopleCount = _.size(people);
      let roomCount = _.size(rooms);
      io.sockets.emit("update-people", {people, peopleCount});
      io.sockets.emit("update-rooms", {rooms, roomCount});
    })

    socket.on('send name', (data) => {
      let clean_name = decodeURI(sanitize.escape(data.name));
      let exists = false;
      _.find(people, key => {
        if (key.name.toLowerCase() === clean_name.toLowerCase())
          return (exists = true);
      });
      if(exists){
        let randomNumber = Math.floor(Math.random() * 1001);
        let proposedName;
        do {
          proposedName = clean_name + randomNumber;
          //check if proposed username exists
          _.find(people, key => {
            if (key.name.toLowerCase() === proposedName.toLowerCase())
              return (exists = true);
          });
        } while (!exists);
        socket.emit("exists", {
          msg: "The username already exists, please pick another one.",
          proposedName: proposedName
        });
      }else{
        people[socket.id] = {
          name: clean_name,
          owns: null,
          inroom: null,
          device: data.device,
          peerId: peerId,
          color: getRandomColor(),
        };
        socket.emit("admin chat",{
          msg: "You have connected to the server.",
          from: 'Admin'
        });
        io.sockets.emit("admin chat", {
          from: "Admin",
          msg: people[socket.id].name + " is online."
        });

        peopleCount = _.size(people);
        io.sockets.emit("update-people", {people, peopleCount});
      }
    })

    socket.on('create room', (roomData) => {
      if (people[socket.id].inroom) {
        socket.emit("admin chat", {
          from: "Admin",
          msg: "You are already in a room. Please leave it first to create your own."
        });
      } else if (!people[socket.id].owns) {
        let id = uuid.v4();
        let clean_name = sanitize.escape(roomData.name);
        let room = new Room(clean_name, id, socket.id);
        rooms[id] = room;
        roomCount = _.size(rooms);

        room.peopleLimit = roomData.limit;
      socket.room = clean_name;
      socket.join(socket.room);
      people[socket.id].owns = id;
      people[socket.id].inroom = id;
      room.addPerson(socket.id);
      socket.emit("admin chat", {
        from: "Admin",
        msg: "Welcome to " + room.name
      });

      io.sockets.emit("update rooms", { rooms, roomCount });
    } else {
      socket.emit("admin chat", {
        from: "Admin",
        msg: "You have already created a room."
      });
    }
    })
    socket.on('disconnect', () => {
      delete people[socket.id];
      io.sockets.emit("update-people", people);
    })

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