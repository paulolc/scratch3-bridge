const EventEmitter = require('events');
const base10 = require('./base10')
const Scratch = require('scratch-api');
const readline = require('readline');

const MAXFRAGMENTSIZE = 120;
const MSGIDSIZE = 5;
const MSGSEQSIZE = 2;
const HEADERSIZE = MSGIDSIZE + MSGSEQSIZE;
const TIME_BETWEEN_MESSAGES_SENT_IN_MS = 100;
const PINGINTERVAL_IN_MILLIS = 5000;

const INCOMING_CLOUDVAR = "@scratch";
const OUTGOING_CLOUDVAR = "@cloud";
const PING_CLOUDVAR = "@ping"


let nonce = (()=>{
    let c = Math.floor(Math.random() * 8888)+1000;
    return ()=>{
       return c++ % 1000;
    }
  })()
  

function debug(msg){
    if( ScratchBridge.DEBUG ){
//        const d = new Date();
        console.log( `${new Date().toISOString()} [DEBUG]: ScratchBridge: ${msg}`)
}
};

function error(msg){
    console.log( `${d.toISOString()} [ERROR]: ScratchBridge: ${msg}`)
}

class ScratchBridge extends EventEmitter{

    constructor(user=null, password=null, project=null, debug=false){
        super();
        this.user = user;
        this.password = password;
        this.project = project;
        ScratchBridge.DEBUG = debug;
        let self = this;
        this.on('_ready', () => {
            self._opensession();        
        });
    }

    _promptvalues(){

        let self = this;

        Scratch.UserSession.load( (err, session) => {

            if (err) { error(err); return; }            

            self.session = session;
            if( self.project != null ){
                self.emit('_ready');                    
                return;
            }

            session.getAllProjects( (err, projects) => {

                if (err) { error(err); return; }            

                let c = projects.length;
                projects.reverse().forEach((project)=>{
                    console.log( `${c} - ${ project.fields.title } ( ${ project.pk } )`);
                    c -= 1;
                });

                const stdinput = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                  });
                  
                stdinput.question('Choose the project to connect to:', (idx) => {
                    const projectidx = projects.length - idx; 
                    let project = projects[projectidx];
                    self.project = project.pk;
                    self.emit('_ready');                    
                    stdinput.close();
                })
            })
        })
    }

    _startping(){
        let self = this;
        setInterval(()=>{ 
            self._sendraw(PING_CLOUDVAR, `${nonce()}`); 
          }, PINGINTERVAL_IN_MILLIS)   
    }

    _getvarhandler(){
        let self = this;
        return (cloudvarname, value) =>{ 
            const varname = cloudvarname.substr(2);
            if( varname === INCOMING_CLOUDVAR ){
                const header = value.substr(0,HEADERSIZE);
                const sourceid = value.substr(0,MSGIDSIZE);
                const seqnr = value.substr(MSGIDSIZE,MSGSEQSIZE);
                const msg = value.substr(HEADERSIZE,value.length);
                const decoded = base10.decode( msg );
                debug(`_setvarhandler:   var: ${varname}`);
                debug(`_setvarhandler:  data: ${value}`);
                debug(`_setvarhandler: split: ${sourceid} | ${seqnr} | ${msg}`);
                debug(`_setvarhandler:   msg: ${decoded}`);
                self.emit('data',  decoded, header, sourceid, seqnr );    
            } else {
                debug(`_setvarhandler: unknown var: ${varname}`);
                debug(`_setvarhandler:        data: ${value}`);
                self.emit(varname, value);    
            }
        }
    }
    
    _opensession(){
	    let self = this;
        this.session.cloudSession(this.project, (err, cloudvars) => {
            if (err) { error(err); return; }            
            self._cloudvars = cloudvars;
            self._cloudvars.on('set', self._getvarhandler());
            if( !self._connected ){
                self._connected = true;
                self.emit('connect' );
                self._startping();
            }
        })
    }

    send( header, str, cb ){
        this._send( OUTGOING_CLOUDVAR,header,str,cb);
    }

    _sendraw(varname, str){
        if( str.slice(-2) != Base10.ENDCHARSEQ ){
            str+=Base10.ENDCHARSEQ;
        }
        debug(`_sendraw: ${varname}, str (${str.length}) : ${str}` );
        this._cloudvars.set(`☁ ${varname}`, str); 
    }

    _send( varname, header, msg, cb ){
        let self = this;
        if( ! this.session ){
            if(cb){
                cb(new Error('Session not opened'));
            }
            return;            
        }

        const encodedmsg = base10.encode(msg);
        const splitonsizeregex = new RegExp(`.{1,${MAXFRAGMENTSIZE}}`,"g");
        const splitmsg = encodedmsg.match(splitonsizeregex).map((str)=>header+str);
        debug(`send: to: ${varname}`);
        debug(`send: msg: ${msg}`);
        debug(`send: encoded(${encodedmsg.length}): ${encodedmsg}`);
        debug(`send: splitted: ${splitmsg}`);

        let interval = setInterval(()=>{
            const str = splitmsg.shift()
            if( str ){
                self._sendraw( varname, str );
            } else {
                clearInterval( interval );
                if(cb){ cb(); }
                return;
            }
        },TIME_BETWEEN_MESSAGES_SENT_IN_MS);
    }

    _createsession(){
        let self = this;
        Scratch.UserSession.create( this.user, this.password , (err, usersession) => {
            if (err) { error(err); return; }            
            self.session = usersession;
            this.emit('_ready');
        })
    }

    connect(){
        if( this.user == null || this.password == null || this.project == null ){
            this._promptvalues();
        } else {
            this._createsession();
        }
    }    

}

module.exports = ScratchBridge;

