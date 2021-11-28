const parseSelect = (selectString: string, but = false) : {
    isSelected: (val: string|string[]) => boolean,
    values: string[]
} => {
  if (!selectString)
    return {
      values: [],
      isSelected: () => but
    };
  const parts = selectString.split(',');
  const select: string[] = [];

  parts.forEach(part => {
    if (part.includes('-')) {
      const splits = part.split('-');
      if (splits.length !== 2) {
        console.log(`[WARN] Unable to parse input "${part}"`);
        return;
      }

      const firstPart = splits[0];
      const match = firstPart.match(/[A-Za-z]+/);
      if (match && match.length > 0) {
        if (match.index && match.index !== 0) {
          console.log(`[WARN] Unable to parse input "${part}"`);
          return;
        }
        const letters = firstPart.substring(0, match[0].length);
        const number = parseInt(firstPart.substring(match[0].length));
        const b = parseInt(splits[1]);
        if (isNaN(number) || isNaN(b)) {
          console.log(`[WARN] Unable to parse input "${part}"`);
          return;
        }
        for (let i = number; i <= b; i++) {
          select.push(`${letters}${i}`);
        }

      } else {
        const a = parseInt(firstPart);
        const b = parseInt(splits[1]);
        if (isNaN(a) || isNaN(b)) {
          console.log(`[WARN] Unable to parse input "${part}"`);
          return;
        }
        for (let i = a; i <= b; i++) {
          select.push(`${i}`);
        }
      }

    } else {
      if (part.match(/[0-9A-Z]{9}/)) {
        select.push(part);
        return;
      }
      const match = part.match(/[A-Za-z]+/);
      if (match && match.length > 0) {
        if (match.index && match.index !== 0) {
          console.log(`[WARN] Unable to parse input "${part}"`);
          return;
        }
        const letters = part.substring(0, match[0].length);
        const number = parseInt(part.substring(match[0].length));
        if (isNaN(number)) {
          console.log(`[WARN] Unable to parse input "${part}"`);
          return;
        }
        select.push(`${letters}${number}`);
      } else {
        select.push(`${parseInt(part)}`);
      }
    }
  });

  return {
    values: select,
    isSelected: (st) => {
      if (typeof st === 'string')
        st = [st];
      return st.some(st => {
        const match = st.match(/[A-Za-z]+/);
        if (st.match(/[0-9A-Z]{9}/)) {
          const included = select.includes(st);
          return but ? !included : included;
        } else if (match && match.length > 0) {
          if (match.index && match.index !== 0) {
            return false;
          }
          const letter = st.substring(0, match[0].length);
          const number = parseInt(st.substring(match[0].length));
          if (isNaN(number)) {
            return false;
          }
          const included = select.includes(`${letter}${number}`);
          return but ? !included : included;
        } else {
          const included =  select.includes(`${parseInt(st)}`);
          return but ? !included : included;
        }
      });
    }
  };
};

export default parseSelect;