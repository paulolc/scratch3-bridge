const EventEmitter = require('events');
const base10 = require('./base10')
const Scratch = require('scratch-api');
const readline = require('readline');

const MAXFRAGMENTSIZE = 120;

function debug(msg){
    if( ScratchBridge.DEBUG ){
        console.log( `${Date.now()} [DEBUG]: ScratchBridge: ${msg}`)
    }
};

function error(msg){
    console.log( `${Date.now()} [ERROR]: ScratchBridge: ${msg}`)
}

class ScratchBridge extends EventEmitter{

    constructor(user=null, password=null, project=null, debug=false){
        super();
        this.user = user;
        this.password = password;
        this.project = project;
        ScratchBridge.DEBUG = debug;
        this.on('_ready', () => {
            this._opensession();        
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

    _opensession(){
    
	let self = this;

        this.session.cloudSession(this.project, (err, cloudvars) => {
            if (err) { error(err); return; }            

            self._cloudvars = cloudvars;

            self._cloudvars.on('set', (cloudvarname, value) => { 
                const decoded = base10.decode( value );
                const varname = cloudvarname.substr(2);
                self.emit(varname, decoded);

            })
            if( !self._connected ){
                self._connected = true;
                self.emit('connect' );
            }

        })
        
    }

    sendunsplitted( name, arr, cb ){
        if( ! this.session ){
            if(cb){
                cb(new Error('Session not opened'));
            }
            return;            
        }
        const encodedmsg = base10.encode(arr);
        debug(`sendunsplitted: arr:\n ${arr}`);
        debug(`sendunsplitted: encodedmsg(${encodedmsg.length}):\n ${encodedmsg}`);
        self._cloudvars.set(`☁ ${name}`, encodedmsg); 
    }

    send( name, str, cb ){
        this.sendarray(name,[str],cb);
    }


    sendarray( name, msg, cb ){
        if( ! this.session ){
            if(cb){
                cb(new Error('Session not opened'));
            }
            return;            
        }

        const encodedmsg = base10.encode(msg);
        const splitonsizeregex = new RegExp(`.{1,${MAXFRAGMENTSIZE}}`,"g");
        const splitmsg = encodedmsg.match(splitonsizeregex);
        debug(`sendarray: msg:\n ${msg}`);
        debug(`sendarray: encodedmsg(${encodedmsg.length}):\n ${encodedmsg}`);
        debug(`sendarray: splitmsg: ${splitmsg}`);

        let i=0;
        let interval = setInterval(()=>{
            if( i < splitmsg.length ){
                let splittedstr=splitmsg[i];
                i+=1;
                if( splittedstr.slice(-2) != Base10.ENDCHARSEQ ){
                    splittedstr+=Base10.ENDCHARSEQ;
                }
                debug(`sendarray: splitted str [${i}] (${splittedstr.length}) : ${splittedstr}` );
                this._cloudvars.set(`☁ ${name}`, splittedstr); 
            } else {
                clearInterval( interval );
            }

        },100);
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

