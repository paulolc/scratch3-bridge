

Base10 = {

    ALL_CHARS: "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz?!@.,:;)(-_{}[]%$#+-*/ÀÉÓÍàáãâóõôêéè",
    //         |         |         |         |         |         |         |         |         |         |        |
    //         0        10        20        30        40        50        60        70        80        90        99
    
    encodechar2twodigits(char){
        return (Base10.ALL_CHARS.search(char) + 1).toString().padStart(2,0)
    },
    
    encodestring2twodigits(str){
        let encodedcharsarray = [...str].map( char => Base10.encodechar2twodigits(char));
        return encodedcharsarray.join("");
    },
    
    
    encode( strarray ){
        return `${ strarray.map( Base10.encodestring2twodigits ).join("00") }00` ;
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
