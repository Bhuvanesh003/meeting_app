const express = require('express');
const axios = require('axios');
// const { Socket } = require('socket.io');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {v4:uuidV4} = require('uuid');
const cors = require('cors');

let dataa;
app.set('view engine','ejs');
app.use(express.static('public'));
app.get('/',(req,res,next)=>{
    res.redirect(`/${uuidV4()}`);
});
app.get("/:room",(req,res,next)=>{
    res.render('room',{roomId:req.params.room});
});
app.use(cors());
io.on('connection',(socket)=>{
    socket.on("collect-msg",(args)=>{
        dataa+="\n"+args;
        console.log("msg is",args);
    })
    socket.on("generate",(email)=>{
        //make api call here
        axios.post("http://localhost:5000/summarize", {
      to: email,
      txt: dataa
    })
    .then((response) => {
      console.log(response);
    });
        console.log("tanscript is",dataa);
    })
    socket.on('join-room',(roomId,userId)=>{
        socket.join(roomId)
        console.log(roomId,"-",userId)
        socket.to(roomId).emit('user-connected',userId);
        socket.on('disconnect',()=>{
            socket.to(roomId).emit('user-disconnected',userId);
        })
        // .broadcast.emit('user-connected', userId);
    })
    socket.on('audioStream', (obj) => {
        //obj is JSON object structured like this: {"audio_data": base64 string....}
       
        //verified here that stream is being received continuously
        console.log("OBJECT"+obj);
        
    })
})
server.listen(3000,()=>{
    console.log("Server Started");
})