// import { Server } from 'socket.io';
// import { createServer } from 'node:http';
// import { app } from "./app.js";


// export const server = createServer(app);
// const io = new Server(server);


// let users = [];

// const addUser = (userData, socketId) => {
//     !users.some(user => user?._id === userData?._id) && users.push({ ...userData, socketId });
// }

// const removeUser = (socketId) => {
//     users = users.filter(user => user?.socketId !== socketId);
// }

// const getUser = (userId) => {
//     return users.find(user => user?._id === userId);
// }

// io.on('connection',  (socket) => {
//     console.log('user connected')

//     //connect
//     socket.on("addUser", userData => {
//         addUser(userData, socket.id);
//         io.emit("getUsers", users);
//     })

//     //send message
//     socket.on('sendMessage', (data) => {
//         const user = getUser(data.to);       
//         io.to(user?.socketId).emit('getMessage', data)
//         io.to(socket.id).emit('getMessage', data)
        
//     })

//     //disconnect
//     socket.on('disconnect', () => {
//         console.log('user disconnected');
//         removeUser(socket.id);
//         io.emit('getUsers', users);
//     })
// })