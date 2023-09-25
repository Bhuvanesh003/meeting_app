
const socket=io('/')
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer({
    host:'/',
    port:'3001'
})
let togglemic = 1,togglevideo=1;
let text = {};
let room="";
const myVideo = document.createElement('video');
myVideo.muted=true;
uid=""
const peers={}
myPeer.on('connection', (dataConnection) => {
    dataConnection.on('data', (data) => {
        console.log(`Received message: ${data}`);
    });
});
navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
}).then(async (stream) =>{
    addVideoStream(myVideo , stream,"mine")
    //

    myPeer.on('call',(call)=>{
        console.log("IM In");
        call.answer(stream);
        const video =document.createElement('video')
        video.setAttribute('id',call.peer);
        call.on('stream',userVideoStream=>{
            addVideoStream(video,userVideoStream,"in");
        })
        document.getElementById("mictoggle").onclick = ()=>{
            let recognition;
            let output= "";
            if(togglemic){
                stream.getAudioTracks()[0].enabled = false;
                togglemic =0;
                document.getElementById("mictoggle").innerText="MIC(🔇)";
                console.log("mic off");
                if (recognition) {
                    recognition?.stop();
                    console.log('Recording stopped...');
                }
            }
            else {
                stream.getAudioTracks()[0].enabled = true;
                document.getElementById("mictoggle").innerText="MIC(🎙️)";
                console.log("mic on");
                recognition = new webkitSpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = false;
                recognition.onstart = () => {
                    console.log('Recording started...');
                };

                recognition.onresult = (event) => {
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            // outputDiv.innerHTML += `<p>${transcript}</p>`;
                            console.log("transcript->",transcript);
                            socket.emit("collect-msg",transcript);
                            //speech from other user

                            text[Date.now()]=transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }
                    if(interimTranscript!="") output= interimTranscript;
                    // console.log('Interim transcript:', interimTranscript);
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                };

                recognition.onend = () => {
                    console.log('Recording ended...');
                };

                recognition.start();
                togglemic =1;
        
            }
        }
        document.getElementById("videotoggle").onclick = ()=>{
            if(togglevideo){
                stream.getVideoTracks()[0].enabled = false;
                togglevideo =0;
                document.getElementById("videotoggle").innerText="VIDEO👇🏻(on)";
                console.log("video off");
            }
            else {
                stream.getVideoTracks()[0].enabled = true;
                togglevideo =1;
                document.getElementById("videotoggle").innerText="VIDEO👇🏻(off)";
                console.log("video on");
        
            }
        }
    })
    
    socket.on('user-connected',(userId)=>{
        console.log("USER CONNECTED "+userId);
        // connectToNewUser(userId,stream);
        setTimeout(connectToNewUser,1000,userId,stream)
    })
    socket.on('user-disconnected',(userId)=>{
        console.log("USER DISCONNECTED "+userId);
        const currentUrl = window.location.href; console.log(currentUrl);
        // socket.broadcast.to(idid).emit('message', 'blah');
        
        document.getElementById(userId).remove();
        if (peers[userId]){
            console.log("CLOSED");
            peers[userId].close()
        }
        delete peers[userId];
        console.log("SIZE"+Object.keys(peers).length);
    })



}).catch((error)=>{
    console.log(error);
})

myPeer.on('open',id=>{
    console.log("OPEN"+id);
    myVideo.setAttribute('id',id);
    room = ROOM_ID
    socket.emit('join-room',ROOM_ID,id);
    myVideo.setAttribute('id',id);
})

function connectToNewUser(userId,stream)
{
    console.log("NEW USER");
    const call =myPeer.call(userId,stream);
    const video=document.createElement('video');
    video.setAttribute('id',userId);
    call.on('stream',(userVideoStream)=>{
        console.log("ADD NEW VIDEO");
        addVideoStream(video, userVideoStream ,"new");
    })
    console.log("MIC ",stream.getAudioTracks()[0]);
    document.getElementById("mictoggle").onclick = ()=>{
        let recognition;
        let output= "";
        if(togglemic){
            stream.getAudioTracks()[0].enabled = false;
            togglemic =0;
            document.getElementById("mictoggle").innerText="MIC(🔇)";
            console.log("mic off");
           // if (recognition) {
                recognition?.stop();
                console.log('Recording stopped...');
            //}
           // else  console.log('Recording not stopped...',recognition); 
        }
        else {
            stream.getAudioTracks()[0].enabled = true;
            document.getElementById("mictoggle").innerText="MIC(🎙️)";
            console.log("mic on");
            recognition = new webkitSpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = false;
                recognition.onstart = () => {
                    console.log('Recording started...');
                };

                recognition.onresult = (event) => {
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            // outputDiv.innerHTML += `<p>${transcript}</p>`;
                            console.log("transcript ",transcript);
                            socket.emit("collect-msg",transcript);
                            //speech from current user
                            text[Date.now()]=transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }
                    if(interimTranscript!="") output= interimTranscript;
                    // console.log('Interim transcript:', interimTranscript);
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                };

                recognition.onend = () => {
                    console.log('Recording ended...');
                };

                recognition.start();
                togglemic =1;
        }
    }
    document.getElementById("videotoggle").onclick = ()=>{
        if(togglevideo){
            stream.getVideoTracks()[0].enabled = false;
            togglevideo =0;
            document.getElementById("videotoggle").innerText="VIDEO👇🏻(on)";
            console.log("video off");
        }
        else {
            stream.getVideoTracks()[0].enabled = true;
            togglevideo =1;
            document.getElementById("videotoggle").innerText="VIDEO👇🏻(off)";
            console.log("video on");
    
        }
    }
    call.on('close', () => {
        // Peer disconnected
        // console.log(`Peer ${callerId} disconnected`);
        // delete connectedPeers[callerId];
        let callerId = call.peer;
        // Check if there are no connected peers left
        if (Object.keys(peers).length === 0) {
            console.log(`The room is empty`);
        } else {
            // Notify remaining users that someone left
            const message = `${callerId} left the call.`;
            Object.keys(peers).forEach(peerId => {
                if (peerId !== callerId) {
                    const dataConnection = myPeer.connect(peerId);
                    dataConnection.send(message);
                }
            });
        }
        video.remove();
    });


    peers[userId] = call;
}

function addVideoStream(video,stream,stat){
    console.log("VIDEO "+stat);
    video.srcObject=stream
    video.addEventListener('loadedmetadata',()=>{
        video.play();
    })
    videoGrid.append(video);
}

document.getElementById("recording").onclick = ()=>{

    console.log("the transcript for this user is\n",text);
    // socket.emit('generate', #EMAIL#);
    document.getElementById('emailForm').style.display = 'block';
    // window.location = "http://www.google.com";

}
document.getElementById('emailForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var email = document.getElementById('email').value;

    // Store the email in JavaScript (you can use localStorage, a database, or send it to a server)
    // For this example, we'll use localStorage
    localStorage.setItem('email', email);

    alert('Soon Your Summary will be mailed');
    socket.emit('generate', email);
    // Optional: Reset the form and hide it
    // document.getElementById('emailForm').reset();
    document.getElementById('emailForm').style.display = 'none';
});
