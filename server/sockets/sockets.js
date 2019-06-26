let sanitize = require("validator");
let _ = require("underscore")._;
let uuid = require("node-uuid");
let Room = require("../room.js");
let moment = require('moment-timezone')
var emoji = require('node-emoji')
module.exports = io => {
  let people = {};
  let rooms = {};
  let sockets = [];
  let adminColor = "rgb(255,255,255)";
  let peerId;
  let timezone;
  io.sockets.on("connection", socket => {
    let peopleCount = _.size(people);
    let roomCount = _.size(rooms);
    io.sockets.emit("update-people", { people, peopleCount });
    io.sockets.emit("update-rooms", { rooms, roomCount });

    socket.on("peerId", peer => {
      console.log(peer)
      peerId = peer.id;
      socket.on("send name", data => {
        timezone = data.timezone;
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
            peer: peer,
            color: getRandomColor(),
            id: socket.id
          };
          socket.emit("admin chat", {
            msg: "You have connected to the server."  + emoji.get('coffee'),
            from: "Admin",
            color: adminColor,
            time: moment().tz(timezone).format('h:mm:ss a')
          });
          io.sockets.emit("admin chat", {
            from: "Admin",
            msg: people[socket.id].name + " is online.",
            color: adminColor,
            time: moment().tz(timezone).format('h:mm:ss a')
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
          time: moment().tz(timezone).format('h:mm:ss a')
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
          time: moment().tz(timezone).format('h:mm:ss a')
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
          time: moment().tz(timezone).format('h:mm:ss a')
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
            time: moment().tz(timezone).format('h:mm:ss a')
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
            time: moment().tz(timezone).format('h:mm:ss a')
          });
        } else {
          if (_.contains(room.people, socket.id)) {

            socket.emit("admin chat", {
              from: "Admin",
              msg: "You have already joined this room.",
              color: adminColor,
              time: moment().tz(timezone).format('h:mm:ss a')
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
                time: moment().tz(timezone).format('h:mm:ss a')
              });
            }
            if (room.people.length < room.limit) {

              user = people[socket.id];
              io.sockets.in(socket.room).emit("admin chat", {
                from: "Admin",
                msg: user.name + " has connected to " + decodeURI(room.name),
                color: adminColor,
                time: moment().tz(timezone).format('h:mm:ss a')
              });
              socket.emit("admin chat", {
                from: "Admin",
                msg: "Welcome to " + decodeURI(room.name) + ".",
                color: adminColor,
                time: moment().tz(timezone).format('h:mm:ss a')
              });
              room.addPerson(socket.id);
              people[socket.id].inroom = id;
              socket.room = room.name;
              socket.join(socket.room);
              socket.emit('join succeeded', id)
              socket.emit("refresh", room.body);
            } else {

              socket.emit("admin chat", {
                from: "Admin",
                msg: "The room is full.",
                color: adminColor,
                time: moment().tz(timezone).format('h:mm:ss a')
              });
              socket.emit('join failed')
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
          time: moment().tz(timezone).format('h:mm:ss a')
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
      console.log(msg);
      io.sockets.in(socket.room).emit("message", {
        msg: emoji.emojify(decodeURI(msg.msg.replace(/(<([^>]+)>)/ig,""))),
        color: people[socket.id].color,
        from: people[socket.id].name,
        time: moment().tz(timezone).format('h:mm:ss a')
      });
    });

    socket.on("whisper", data => {
      if (socket.id === data.to) {
        socket.emit("whisper", {
          from: "Admin",
          msg: "You can't whisper to yourself.",
          time: moment().tz(timezone).format('h:mm:ss a'),
          color: adminColor
        });
        return
      }
      io.sockets.connected[data.from].emit("whisper", {
        msg: emoji.emojify(decodeURI(data.msg.replace(/(<([^>]+)>)/ig,""))),
        color: people[socket.id].color,
        from: people[data.from].name,
        time: moment().tz(timezone).format('h:mm:ss a'),
        to: people[data.to].name
      });
      io.sockets.connected[data.to].emit("whisper", {
        msg: emoji.emojify(decodeURI(data.msg.replace(/(<([^>]+)>)/ig,""))),
        color: people[socket.id].color,
        from: people[data.from].name,
        time: moment().tz(timezone).format('h:mm:ss a'),
        to: people[data.to].name
      });
      io.sockets.connected[data.to].emit("open dialog", {});
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

    socket.on('change color', rgb => {
      people[socket.id].color = "rgb(" + rgb.red + "," + rgb.green + "," + rgb.blue + ")";
      peopleCount = _.size(people);
      io.sockets.emit("update-people", { people, peopleCount });
    })

    socket.on('get emojis', (val) => {
      socket.emit('recieve emojis', emoji.search(val.substring(1)))
    })

    //CALLS
    socket.on("call_request", data => {
        io.sockets.connected[data].emit("request", {
          person: people[socket.id].name,
          msg: " is requesting a video chat",
          peerId: people[socket.id].peerId,
          caller: people[socket.id],
          callee: people[data],
          caller_socket: data
        });

    });
    socket.on("call rejected", data => {
      console.log(data)
      io.sockets.connected[data.caller.id].emit("call rejected", {});
    });

    socket.on("refresh", body => {
      let room = rooms[people[socket.id].inroom];
      room.body = body;
    });

    socket.on("change", op => {
        if (
          op.origin == "+input" ||
          op.origin == "paste" ||
          op.origin == "+delete"
        ) {
          socket.broadcast.to(socket.room).emit("change", op);
          socket.broadcast.to(socket.room).emit("disable", true);
        }

    });

    socket.on('enable', () => {
      socket.broadcast.to(socket.room).emit('enable', false);
    })
    socket.on("theme", data => {
      socket.emit("send theme", data);
    });
    socket.on("mode", data => {
      socket.emit("send mode", data);
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
