

Base10 = {

    ALL_CHARS: "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz?!@.,:;)(-_{'[]%$#+-*/ÀÉÓÍàáãâóõôêé",
    //         |         |         |         |         |         |         |         |         |         |       |
    //         0        10        20        30        40        50        60        70        80        90      98(99-RESERVED)
    
    DEFAULT_CHAR: "_",
    ENDCHARSEQ : "00",
    RESERVED : "99",

    encodechar2twodigits(char){
        const encodedchar = (Base10.ALL_CHARS.indexOf(char) + 1).toString().padStart(2,0);
        const charnotfound = ( encodedchar === "00" );
        if( charnotfound ){
            return Base10.encodechar2twodigits(Base10.DEFAULT_CHAR);
        } else {
            return encodedchar;
        }
    },
    
    encodestring2twodigits(str){
        let encodedcharsarray = [...`${str}`].map( char => Base10.encodechar2twodigits(char));
        return encodedcharsarray.join("");
    },
    
    endofmessage(){
        return Base10.ENDCHARSEQ+Base10.ENDCHARSEQ;
    },
    
    encode( strarray ){
        if( Array.isArray(strarray)){ 
            return `${ strarray.map( Base10.encodestring2twodigits ).join(Base10.ENDCHARSEQ)}${Base10.endofmessage()}` ;
        } else {
            return `${Base10.encodestring2twodigits(strarray)}${Base10.endofmessage()}`
        }
    },
    
    decode( bignumber ){
        let decodedval = ""
        let values = []
        for( let i=0; i<= bignumber.length -1 ; i=i+2){
            let transtableIdx = parseInt( bignumber.substr( i, 2 ));
            if( transtableIdx == 0 ){
                values.push( decodedval );
                decodedval = ""
            }
            let decodedsymbol = Base10.ALL_CHARS.charAt( transtableIdx - 1 );
            decodedval = decodedval + decodedsymbol;
        }            
        return values;
    },   

}


module.exports = Base10;
