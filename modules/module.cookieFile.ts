const parse = (data: string) => {
  const res: Record<string, {
    value: string,
    expires: Date,
    path: string,
    domain: string,
    secure: boolean
  }> = {};
  const split = data.replace(/\r/g,'').split('\n');
  for (const line of split) {
    const c = line.split('\t');
    if(c.length < 7){
      continue;
    }
    res[c[5]] = {
      value: c[6],
      expires: new Date(parseInt(c[4])*1000),
      path: c[2],
      domain: c[0].replace(/^\./,''),
      secure: c[3] == 'TRUE' ? true : false
    };
  }
  return res;
};

export default parse;
