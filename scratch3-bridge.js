const EventEmitter = require('events');
const base10 = require('./base10')
const Scratch = require('scratch-api');
const readline = require('readline');


class ScratchBridge extends EventEmitter{

    constructor(user=null, password=null, project=null){
        super();
        this.user = user;
        this.password = password;
        this.project = project;
        this.on('_ready', () => {
            this._opensession();        
        });
    }

    _promptvalues(){

        let self = this;

        Scratch.UserSession.load( (err, session) => {

            if (err) {
                console.log(err);
                return;
            }

            self.session = session;

            session.getAllProjects( (err, projects) => {

                if (err) {
                    console.log(err);
                    return;
                }

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
            if (err) {
                console.log(err);
                return;
            }

            self._cloudvars = cloudvars;

            self._cloudvars.on('set', (varname, value) => { 

                const decoded = base10.decode( value );
                self.emit('msg', { name: varname.substr(2), msg: decoded } );

            })
            if( !self._connected ){
                self._connected = true;
                self.emit('connect' );
            }

        })
        
    }

    send( name, msg, cb ){
        if( ! this.session ){
            if(cb){
                cb(new Error('Session not opened'));
            }
            return;            
        }
        const encodedmsg =  base10.encode([msg]);
        this._cloudvars.set(`☁ ${name}`, encodedmsg); 
    }

    _createsession(){
        let self = this;
        Scratch.UserSession.create( this.user, this.password , (err, usersession) => {

            if (err) {
                console.log(err);
                return;
            }

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

