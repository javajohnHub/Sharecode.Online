let sanitize = require("validator");
let _ = require("underscore")._;
let uuid = require("node-uuid");
let Room = require("../room.js");

module.exports = io => {
  let people = {};
  let rooms = {};
  let sockets = [];
  let adminColor = "rgb(255,255,255)";
  let peerId;
  io.sockets.on("connection", socket => {
    let peopleCount = _.size(people);
    let roomCount = _.size(rooms);
    io.sockets.emit("update-people", { people, peopleCount });
    io.sockets.emit("update-rooms", { rooms, roomCount });

    socket.on("peerId", id => {
      peerId = id;
      socket.on("send name", data => {
        let clean_name = decodeURI(data.name.replace(/(<([^>]+)>)/ig,""))
        let exists = false;
        _.find(people, key => {
          if (key.name.toLowerCase() === clean_name.toLowerCase())
            return (exists = true);
        });
        if (exists) {
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
        } else {
          people[socket.id] = {
            name: clean_name,
            owns: null,
            inroom: null,
            device: data.device,
            peerId: peerId,
            color: getRandomColor(),
            id: socket.id
          };
          socket.emit("admin chat", {
            msg: "You have connected to the server.",
            from: "Admin",
            color: adminColor,
            time: new Date().toLocaleTimeString()
          });
          io.sockets.emit("admin chat", {
            from: "Admin",
            msg: people[socket.id].name + " is online.",
            color: adminColor,
            time: new Date().toLocaleTimeString()
          });
          peopleCount = _.size(people);
          io.sockets.emit("update-people", { people, peopleCount });
          roomCount = _.size(rooms);
          io.sockets.emit("update-rooms", { rooms, roomCount });
        }
        sockets.push(socket);
      });
    });

    socket.on("create room", roomData => {
      if (people[socket.id] && people[socket.id].inroom) {
        socket.emit("admin chat", {
          from: "Admin",
          msg:
            "You are already in a room. Please leave it first to create your own.",
          color: adminColor,
          time: new Date().toLocaleTimeString()
        });
      } else if (people[socket.id] && !people[socket.id].owns) {
        let id = uuid.v4();
        let clean_name = decodeURI(roomData.name.replace(/(<([^>]+)>)/ig,""))
        let room = new Room(clean_name, id, socket.id);
        rooms[id] = room;
        room.limit = roomData.limit;
        socket.room = clean_name;
        socket.join(socket.room);
        people[socket.id].owns = id;
        people[socket.id].inroom = id;
        room.addPerson(socket.id);

        socket.emit("admin chat", {
          from: "Admin",
          msg: "Welcome to " + room.name,
          color: adminColor,
          time: new Date().toLocaleTimeString()
        });

        peopleCount = _.size(people);
        io.sockets.emit("update-people", { people, peopleCount });
        roomCount = _.size(rooms);
        io.sockets.emit("update-rooms", { rooms, roomCount });
      } else {

        socket.emit("admin chat", {
          from: "Admin",
          msg: "You are not logged in",
          color: adminColor,
          time: new Date().toLocaleTimeString()
        });
      }
    });

    socket.on("remove room", () => {
      let rms = Object.values(rooms);
      rms.forEach(room => {
        if (socket.id === room.owner) {
          delete rooms[room.id];
          people[socket.id].owns = null;
          people[socket.id].inroom = null;
        } else {

          socket.emit("admin chat", {
            from: "Admin",
            msg: "Only the owner can remove a room.",
            color: adminColor,
            time: new Date().toLocaleTimeString()
          });
        }
      });

      let roomCount = _.size(rooms);
      io.sockets.emit("update-rooms", { rooms, roomCount });
    });

    socket.on("join room", id => {
      if (typeof people[socket.id] !== "undefined") {
        let room = rooms[id];
        if (socket.id === room.owner) {

          socket.emit("admin chat", {
            from: "Admin",
            msg:
              "You are the owner of this room and you have already been joined.",
            color: adminColor,
            time: new Date().toLocaleTimeString()
          });
        } else {
          if (_.contains(room.people, socket.id)) {

            socket.emit("admin chat", {
              from: "Admin",
              msg: "You have already joined this room.",
              color: adminColor,
              time: new Date().toLocaleTimeString()
            });
          } else {
            if (people[socket.id].inroom !== null) {

              socket.emit("admin chat", {
                from: "Admin",
                msg:
                  "You are already in a room (" +
                  decodeURI(rooms[people[socket.id].name]) +
                  "), please leave it first to join another room.",
                color: adminColor,
                time: new Date().toLocaleTimeString()
              });
            }
            if (room.people.length < room.limit) {

              user = people[socket.id];
              io.sockets.in(socket.room).emit("admin chat", {
                from: "Admin",
                msg: user.name + " has connected to " + decodeURI(room.name),
                color: adminColor,
                time: new Date().toLocaleTimeString()
              });
              socket.emit("admin chat", {
                from: "Admin",
                msg: "Welcome to " + decodeURI(room.name) + ".",
                color: adminColor,
                time: new Date().toLocaleTimeString()
              });
              room.addPerson(socket.id);
              people[socket.id].inroom = id;
              socket.room = room.name;
              socket.join(socket.room);
            } else {

              socket.emit("admin chat", {
                from: "Admin",
                msg: "The room is full.",
                color: adminColor,
                time: new Date().toLocaleTimeString()
              });

            }
          }
        }

        peopleCount = _.size(people);
        io.sockets.emit("update-people", { people, peopleCount });
        let roomCount = _.size(rooms);
        io.sockets.emit("update-rooms", { rooms, roomCount });
      } else {

        socket.emit("admin chat", {
          from: "Admin",
          msg: "Please enter a valid name first.",
          color: adminColor,
          time: new Date().toLocaleTimeString()
        });
      }
      let roomCount = _.size(rooms);
      io.sockets.emit("update-rooms", { rooms, roomCount });
    });

    socket.on("leave room", id => {
      let room = rooms[id];
      if (room) {
        let socketids = [];

        for (let i = 0; i < sockets.length; i++) {
          socketids.push(sockets[i].id);
          if ((_.contains(socketids), room.people)) {
            if (socket.id === room.owner) {
              sockets[i].leave(room.name);
            }

          }

        }

        people[socket.id].owns = null;
        people[socket.id].inroom = null;
        room.people = _.without(room.people, socket.id); //remove people from the room:people{}collection
        if(rooms[room.id].people.length === 0) {
          delete rooms[room.id];
        }
        if(room.people.length > 0){
          rooms[id].owner = room.people[0];
          people[room.people[0]].owns = room.id;
        }


        peopleCount = _.size(people);
        io.sockets.emit("update-people", { people, peopleCount });
        let roomCount = _.size(rooms);
        io.sockets.emit("update-rooms", { rooms, roomCount });
      }
    });
    socket.on("message", msg => {
      console.log(people[socket.id]);
      io.sockets.in(socket.room).emit("message", {
        msg: decodeURI(msg.replace(/(<([^>]+)>)/ig,"")),
        color: people[socket.id].color,
        from: people[socket.id].name,
        time: new Date().toLocaleTimeString()
      });
    });

    socket.on("whisper", data => {
      console.log(data)
      socket.emit("whisper", {
        from: people[socket.id].name,
        to: people[data.id].name,
        msg: decodeURI(data.msg.replace(/(<([^>]+)>)/ig,"")),
        time: new Date().toLocaleTimeString()
      });
      io.sockets.connected[data.id].emit("whisper", {
        msg: decodeURI(data.msg.replace(/(<([^>]+)>)/ig,"")),
        color: people[socket.id].color,
        from: people[socket.id].name,
        time: new Date().toLocaleTimeString()
      });
    });
    socket.on("disconnected", () => {
      let rms = Object.values(rooms);
      rms.forEach(room => {
        if (_.contains(room.people, socket.id)) {
          /*room.people[0].owns = */ room.people = _.without(
            room.people,
            socket.id
          );
          if (room.owner === socket.id && room.people.length > 0) {
            people[rooms[room.id].people[0]].owns = people[socket.id].owns;
            rooms[room.id].owner = rooms[room.id].people[0];

            peopleCount = _.size(people);
            io.sockets.emit("update-people", { people, peopleCount });
            let roomCount = _.size(rooms);
            io.sockets.emit("update-rooms", { rooms, roomCount });
          } else {
            if (_.contains(room.people, socket.id)) {
              let personIndex = room.people.indexOf(socket.id);
              room.people.splice(personIndex, 1);
              socket.leave(room.name);
            }
            delete people[socket.id];
            console.log(room.people.length);
            if (room.people.length === 0) {
              delete rooms[room.id];
              let roomCount = _.size(rooms);
              io.sockets.emit("update-rooms", { rooms, roomCount });
            }
          }
        }
      });

      delete people[socket.id];
      peopleCount = _.size(people);
      io.sockets.emit("update-people", { people, peopleCount });
      let roomCount = _.size(rooms);
      io.sockets.emit("update-rooms", { rooms, roomCount });
    });
    socket.on("disconnect", () => {
      let rms = Object.values(rooms);
      rms.forEach(room => {
        if (_.contains(room.people, socket.id)) {
          /*room.people[0].owns = */ room.people = _.without(
            room.people,
            socket.id
          );
          if (room.owner === socket.id && room.people.length > 0) {
            people[rooms[room.id].people[0]].owns = people[socket.id].owns;
            rooms[room.id].owner = rooms[room.id].people[0];
            peopleCount = _.size(people);
            io.sockets.emit("update-people", { people, peopleCount });
            let roomCount = _.size(rooms);
            io.sockets.emit("update-rooms", { rooms, roomCount });
          } else {
            if (_.contains(room.people, socket.id)) {
              let personIndex = room.people.indexOf(socket.id);
              room.people.splice(personIndex, 1);
              socket.leave(room.name);
            }
            delete people[socket.id];
            console.log(room.people.length);
            if (room.people.length === 0) {
              delete rooms[room.id];
              let roomCount = _.size(rooms);
              io.sockets.emit("update-rooms", { rooms, roomCount });
            }
          }
        }
      });

      delete people[socket.id];
      peopleCount = _.size(people);
      io.sockets.emit("update-people", { people, peopleCount });
      let roomCount = _.size(rooms);
      io.sockets.emit("update-rooms", { rooms, roomCount });
    });
  });
};

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
