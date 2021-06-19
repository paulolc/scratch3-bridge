# scratch3-bridge
Javascript library to exchange data with Scratch 3 online projects using cloud variables

# Introduction

This library allows you to develop programs in JavaScript, on any platform that JavaScript runs (PC, Android, Mac, even on a server running in the Cloud) to communicate with Scratch 3 projects. Since JavaScript is a high level programming language, you can develop programs that do not have the Scratch 3 restrictions but which can communicate and extend your Scratch 3 projects. This will allow you to do virtually anything from your Scratch 3 projects like performing complex calculations, controlling robots or other kind of devices, accessing the internet and much more! 

# How to use

## Install the dependencies
```bash
npm install scratch3-bridge
```

## On your code

  1. On Scratch online you'll need to Remix the template project ["S3BRIDGE: node.js connector"](https://scratch.mit.edu/projects/368606046/)

  2. __Initialization:__ On your javascript program, instantiate and initialize a scratch bridge object with your MIT Scratch credentials and the target scratch project id:
  
      ```javascript
      const projectId = 12345678;
      let msgrbridge = new ScratchBridge( "ascratchuser", "theuserpassword", projectId);
      ```
      __HINT:__ If you don't pass any parameters to the ScratchBridge constructor, it will prompt the user for them.
    
  3. __Open the connection:__ Call _connect()_ on the newly instantiated scratch bridge object.

      ```javascript
      msgrbridge.connect();
      ```
  4. __Connection started (OPTIONAL):__ Get notified of when the connection with the Scratch project is established by defining a listener function for the _'connect'_ event

      ```javascript
      msgrbridge.on('connect', () => {
            console.log( "Connected!! Ready to send to and receive data from Scratch."
      }
      ```

  5. __Receive data from Scratch:__ Define a listener function to the 'data' event which is raised on messages coming from the target scratch project. Two objects are passed as parameters to the listener function:  
      - The _message_ which can be either a string or an array of strings
      - The _sender id_ of the message (Integer).  (see the "sender id" section below)
    
        ```javascript
        msgrbridge.on('data', ( msg, asender ) =>{
          // 
        }
        ```
  6. __Send data to Scratch:__ 
  
      ```javascript
      msgrbridge.send( sender, `Message written on the server: ${msg}` );
      ```


# The sender id

It is an integer with the identifier of which scratch project running instance sent the message. You can use this sender id later to respond back to the specific scratch project running instance that sent the original message. For instance, if your scratch project is a game and if multiple people are playing, the sender id will be able to distinguish from multiple running instances of the game.


## Complete example. A simple phrase reverser in node

This is a complete example that demonstrates the use of scratch3-bridge. 

It's a simple phrase reverser and semi-chat. It receives the phrase written on the Scratch project input block and sends the phrase reversed back to the Scratch project.

A companion Scratch project is in https://scratch.mit.edu/projects/368606046/ (You'll need to Remix it and recreate the cloud variables)


```javascript

const readline = require('readline');
const ScratchBridge = require('scratch3-bridge');

let msgrbridge = new ScratchBridge();
/*

Alternative (without prompts):
   
    let msgrbridge = new ScratchBridge( "ascratchuser", "theuserpassword",PROJECT_ID);

*/


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



```





