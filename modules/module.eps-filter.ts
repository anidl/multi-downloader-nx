const epNumLen = { E: 4, S: 3, M: 7 };
const maxRange = 1000;

// selectors
const epRegex     = new RegExp (/^(?:E?|S|M)(\d+)$/);
const betaEpRegex = new RegExp (/^[0-9A-Z]{9}$/);
const epLtReg     = new RegExp (/(?:E|S|M)/);

class doFilter {
  constructor(){}
  ifMaxEp(type: keyof typeof epNumLen, num: number){
    const maxEp = Math.pow(10, epNumLen[type]) - 1;
    return num > maxEp ? true : false;
  }
  powNum(type: keyof typeof epNumLen){
    return Math.pow(10, epNumLen[type]);
  }
  checkFilter(inputEps?: string){
    // check
    const inputEpsArr = inputEps !== undefined
      ? inputEps.toString().split(',') : [];
    // input range
    const inputEpsRange: string | string[] = [];
        
    // filter wrong numbers
    const filteredArr = inputEpsArr.map((e) => {
      // convert to uppercase
      e = e.toUpperCase();
      // if range
      if(e.match('-') && e.split('-').length == 2){
        const eRange: (string|number)[] = e.split('-');
        // check range
        if (!eRange[0].toString().match(epRegex)) return '';
        // set ep latter and pad
        const epLetter = (eRange[0].toString().match(epLtReg) ? (eRange[0].toString().match(epLtReg) || [])[0] : 'E') as keyof typeof epNumLen;
        const padLen = epNumLen[epLetter as keyof typeof epNumLen];
        // parse range
        eRange[0] = eRange[0].toString().replace(epLtReg, '');
        eRange[0] = parseInt(eRange[0]);
        eRange[0] = this.ifMaxEp(epLetter, eRange[0]) ? this.powNum(epLetter) - 1 : eRange[0];
        eRange[1] = eRange[1].toString().match(/^\d+$/) ? parseInt(eRange[1] as string) : 0;
        eRange[1] = this.ifMaxEp(epLetter, eRange[1]) ? this.powNum(epLetter) - 1 : eRange[1];
        console.log(eRange)
        // check if correct range
        if (eRange[0] > eRange[1]){
          const parsedEl = [
            epLetter != 'E' ? epLetter : '',
            eRange[0].toString().padStart(padLen, '0'),
          ].join('');
          return parsedEl;
        }
        if(eRange[1] - eRange[0] + 1 > maxRange){
          eRange[1] = eRange[0] + maxRange - 1;
        }
        const rangeLength = eRange[1] - eRange[0] + 1;
        const epsRangeArr = Array(rangeLength).fill(0);
        for(const i in epsRangeArr){
          const parsedRangeEl = [
            epLetter != 'E' ? epLetter : '',
            (parseInt(i) + eRange[0]).toString().padStart(padLen, '0'),
          ].join('');
          inputEpsRange.push(parsedRangeEl);
        }
        return '';
      }
      else if(e.match(epRegex)){
        const epLetter = (e.match(epLtReg) ? (e.match(epLtReg) || [])[0] : 'E') as keyof typeof epNumLen;
        const padLen = epNumLen[epLetter];
        const e1 = parseInt(e.replace(epLtReg, ''));
        const e2 = this.ifMaxEp(epLetter, e1) ? this.powNum(epLetter) - 1 : e1;
        return (epLetter != 'E' ? epLetter : '') + e2.toString().padStart(padLen, '0');
      }
      else if(e.match(betaEpRegex)){
        return e;
      }
      return '';
    });
    // end
    const filteredArr1 = [...new Set(filteredArr.concat(inputEpsRange))]
    const filteredArr2 = filteredArr1.indexOf('') > -1 ? filteredArr1.slice(1) : filteredArr1;
    return filteredArr2;
  }
  checkMediaFilter(e: string){
    const split = e.split(',');
    const epLetter = 'M';
    const inpMedia = [''];
    // map select
    split.map((e) => {
      if(e.match('-')){
        const eRange = e.split('-');
        if(eRange[0].match(/^m?\d+$/i)){
          eRange[0] = eRange[0].replace(/^m/i,'');
          eRange[0] = (this.ifMaxEp(epLetter, parseInt(eRange[0])) ? this.powNum(epLetter) - 1 : parseInt(eRange[0])).toString();
          inpMedia.push(eRange[0].toString());
        }
      }
      else if(e.match(/^m?\d+$/i)){
        const eMedia = parseInt(e.replace(/^m/i,''));
        const eMediaStr = this.ifMaxEp(epLetter, eMedia) ? this.powNum(epLetter) - 1 : eMedia;
        inpMedia.push(eMediaStr.toString());
      }
    });
    return [...new Set(inpMedia)].splice(1);
  }
  checkBetaFilter(e: string){
    const e1 = ['', ...e.split(',')];
    const e2 = e1.map((e) => {
      if(e.match(betaEpRegex)){
        return e;
      }
      return '';
    });
    const e3 = [...new Set(e2)].splice(1);
    const e4 = e3.length > 100 ? e3.slice(0, 100) : e3;
    return e4;
  }
}

export {
  epNumLen,
  doFilter,
};
