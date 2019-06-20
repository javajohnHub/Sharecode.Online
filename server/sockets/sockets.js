let sanitize = require("validator");
let _ = require("underscore")._;
let uuid = require("node-uuid");
let Room = require("../room.js");

module.exports = io => {
  let people = {};
  let rooms = {};
  let sockets = [];
  let adminColor = "rgb(100,100,100)";
  let peerId;
  io.sockets.on("connection", socket => {
    let peopleCount = _.size(people);
    let roomCount = _.size(rooms);
    io.sockets.emit("update-people", { people, peopleCount });
    io.sockets.emit("update-rooms", { rooms, roomCount });

    socket.on("peerId", id => {
      peerId = id;
      socket.on("send name", data => {
        let clean_name = decodeURI(sanitize.escape(data.name));
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
            color: getRandomColor()
          };
          let d = new Date();
          socket.emit("admin chat", {
            msg: "You have connected to the server.",
            from: "Admin",
            color: adminColor,
            time: d.getHours() + ":" + d.getMinutes()
          });
          io.sockets.emit("admin chat", {
            from: "Admin",
            msg: people[socket.id].name + " is online.",
            color: adminColor,
            time: d.getHours() + ":" + d.getMinutes()
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
        let d = new Date();
        socket.emit("admin chat", {
          from: "Admin",
          msg:
            "You are already in a room. Please leave it first to create your own.",
          color: adminColor,
          time: d.getHours() + ":" + d.getMinutes()
        });
      } else if (people[socket.id] && !people[socket.id].owns) {
        let id = uuid.v4();
        let clean_name = sanitize.escape(roomData.name);
        let room = new Room(clean_name, id, socket.id);
        rooms[id] = room;
        room.limit = roomData.limit;
        socket.room = clean_name;
        socket.join(socket.room);
        people[socket.id].owns = id;
        people[socket.id].inroom = id;
        room.addPerson(socket.id);
        let d = new Date();
        socket.emit("admin chat", {
          from: "Admin",
          msg: "Welcome to " + room.name,
          color: adminColor,
          time: d.getHours() + ":" + d.getMinutes()
        });

        peopleCount = _.size(people);
        io.sockets.emit("update-people", { people, peopleCount });
        roomCount = _.size(rooms);
        io.sockets.emit("update-rooms", { rooms, roomCount });
      } else {
        let d = new Date();
        socket.emit("admin chat", {
          from: "Admin",
          msg: "You have already created a room.",
          color: adminColor,
          time: d.getHours() + ":" + d.getMinutes()
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
          let d = new Date();
          socket.emit("admin chat", {
            from: "Admin",
            msg: "Only the owner can remove a room.",
            color: adminColor,
            time: d.getHours() + ":" + d.getMinutes()
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
          let d = new Date();
          socket.emit("admin chat", {
            from: "Admin",
            msg:
              "You are the owner of this room and you have already been joined.",
            color: adminColor,
            time: d.getHours() + ":" + d.getMinutes()
          });
        } else {
          if (_.contains(room.people, socket.id)) {
            let d = new Date();
            socket.emit("admin chat", {
              from: "Admin",
              msg: "You have already joined this room.",
              color: adminColor,
              time: d.getHours() + ":" + d.getMinutes()
            });
          } else {
            if (people[socket.id].inroom !== null) {
              let d = new Date();
              socket.emit("admin chat", {
                from: "Admin",
                msg:
                  "You are already in a room (" +
                  decodeURI(rooms[people[socket.id].name]) +
                  "), please leave it first to join another room.",
                color: adminColor,
                time: d.getHours() + ":" + d.getMinutes()
              });
            }
            if (room.people.length < room.limit) {
              let d = new Date();
              user = people[socket.id];
              io.sockets.in(socket.room).emit("admin chat", {
                from: "Admin",
                msg: user.name + " has connected to " + decodeURI(room.name),
                color: adminColor,
                time: d.getHours() + ":" + d.getMinutes()
              });
              socket.emit("admin chat", {
                from: "Admin",
                msg: "Welcome to " + decodeURI(room.name) + ".",
                color: adminColor,
                time: d.getHours() + ":" + d.getMinutes()
              });
              room.addPerson(socket.id);
              people[socket.id].inroom = id;
              socket.room = room.name;
              socket.join(socket.room);
            } else {
              let d = new Date();
              socket.emit("admin chat", {
                from: "Admin",
                msg: "The room is full.",
                color: adminColor,
                time: d.getHours() + ":" + d.getMinutes()
              });

              people[socket.id].inroom = null;
            }
          }
        }

        peopleCount = _.size(people);
        io.sockets.emit("update-people", { people, peopleCount });
        let roomCount = _.size(rooms);
        io.sockets.emit("update-rooms", { rooms, roomCount });
      } else {
        let d = new Date();
        socket.emit("admin chat", {
          from: "Admin",
          msg: "Please enter a valid name first.",
          color: adminColor,
          time: d.getHours() + ":" + d.getMinutes()
        });
      }
      let roomCount = _.size(rooms);
      io.sockets.emit("update-rooms", { rooms, roomCount });
    });

    socket.on("leave room", id => {
      let room = rooms[id];
      if (room) {
        if (socket.id === room.owner) {
          let d = new Date();
          io.sockets.in(socket.room).emit("admin chat", {
            from: "Admin",
            msg:
              "The owner (" +
              people[socket.id].name +
              ") has left the room. The room is removed and you have been disconnected from it as well.",
            color: adminColor,
            time: d.getHours() + ":" + d.getMinutes()
          });
        }

        let socketids = [];
        for (let i = 0; i < sockets.length; i++) {
          socketids.push(sockets[i].id);
          if ((_.contains(socketids), room.people)) {
            sockets[i].leave(room.name);
          }
        }

        if ((_.contains(room.people), socket.id)) {
          for (let i = 0; i < room.people.length; i++) {
            if (people[room.people[i]]) {
              people[room.people[i]].inroom = null;
            }
          }
        }
        delete rooms[people[socket.id].owns];
        delete rooms[people[socket.id].inroom];
        people[socket.id].owns = null;
        people[socket.id].inroom = null;
        room.people = _.without(room.people, socket.id); //remove people from the room:people{}collection
        peopleCount = _.size(people);
        io.sockets.emit("update-people", { people, peopleCount });
        let roomCount = _.size(rooms);
        io.sockets.emit("update-rooms", { rooms, roomCount });
      }
    });
    socket.on("message", msg => {
      let d = new Date();
      console.log(people[socket.id]);
      io.sockets.in(socket.room).emit("message", {
        msg: decodeURI(sanitize.escape(msg)),
        color: people[socket.id].color,
        from: people[socket.id].name,
        time: d.getHours() + ":" + d.getMinutes()
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

            people[rooms[room.id].people[0]].owns = people[socket.id].owns
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
          }
        }
      });

      delete people[socket.id];
      peopleCount = _.size(people);
      io.sockets.emit("update-people", { people, peopleCount });
      let roomCount = _.size(rooms);
      io.sockets.emit("update-rooms", { rooms, roomCount });
    });
    socket.on("disconnect", () => {});
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
