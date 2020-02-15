
const readline = require('readline');
const ScratchBridge = require('../scratch3-bridge');

let msgrbridge = new ScratchBridge();
//Alternative (no user prompts made):
//let msgrbridge = new ScratchBridge( "ascratchuser", "theuserpassword",PROJECT_ID);

msgrbridge.connect();

msgrbridge.on('data', msg =>{
    console.log(`> ${msg.msg}`);
});

msgrbridge.on('connect', () => {
    console.log( "Connected!! Sending your messages to Scratch:")
    
    const stdinput = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    stdinput.on('line', (msg) => {
        msgrbridge.send('@servidor', msg );
        if(msg === "quit"){
            stdinput.close();
        }
    })

})


