
const readline = require('readline');
const ScratchBridge = require('../scratch3-bridge');

let msgrbridge = new ScratchBridge();
//Alternative (no user prompts made):
//let msgrbridge = new ScratchBridge( "ascratchuser", "theuserpassword",PROJECT_ID);



msgrbridge.connect();
let sender;

msgrbridge.on('data', (msg,asender) =>{
    console.log(`>(${asender}): ${msg}`);
    sender = asender;
    msgrbridge.send( sender, `String reversed on the server: ${msg.toString().split('').reverse().join('')}`  );
});

msgrbridge.on('connect', () => {
    console.log( "Connected!! Sending your messages to Scratch:")
    
    const stdinput = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    stdinput.on('line', (msg) => {
        
        msgrbridge.send( sender, `Message written on the server: ${msg}` );
        if(msg === "quit"){
            stdinput.close();
        }
    })

})


