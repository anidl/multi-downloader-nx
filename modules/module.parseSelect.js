/**
 * @param {string} selectString
 * @returns {{
 *  isSelected: (val: string) => boolean,
 *  values: string[]
 * }} 
 */
module.exports = (selectString) => {
    if (!selectString)
        return {
            values: [],
            isSelected: () => false
        };
    let parts = selectString.split(',');
    let select = [];


    parts.forEach(part => {
        if (part.includes('-')) {
            let splits = part.split('-');
            if (splits.length !== 2) {
                console.log(`[WARN] Unable to parse input "${part}"`);
                return;
            }

            let firstPart = splits[0];
            let match = firstPart.match(/[A-Za-z]+/);
            if (match && match.length > 0) {
                if (match.index && match.index !== 0) {
                    console.log(`[WARN] Unable to parse input "${part}"`);
                    return;
                }
                let letters = firstPart.substring(0, match[0].length);
                let number = parseInt(firstPart.substring(match[0].length));
                let b = parseInt(splits[1]);
                if (isNaN(number) || isNaN(b)) {
                    console.log(`[WARN] Unable to parse input "${part}"`);
                    return;
                }
                for (let i = number; i <= b; i++) {
                    select.push(`${letters}${i}`);
                }

            } else {
                let a = parseInt(firstPart);
                let b = parseInt(splits[1]);
                if (isNaN(a) || isNaN(b)) {
                    console.log(`[WARN] Unable to parse input "${part}"`);
                    return;
                }
                for (let i = a; i <= b; i++) {
                    select.push(`${i}`);
                }
            }

        } else {
            let match = part.match(/[A-Za-z]+/);
            if (match && match.length > 0) {
                if (match.index && match.index !== 0) {
                    console.log(`[WARN] Unable to parse input "${part}"`);
                    return;
                }
                let letters = part.substring(0, match[0].length);
                let number = parseInt(part.substring(match[0].length));
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
            let match = st.match(/[A-Za-z]+/);
            if (match && match.length > 0) {
                if (match.index && match.index !== 0) {
                    return false;
                }
                let letter = st.substring(0, match[0].length);
                let number = parseInt(st.substring(match[0].length));
                if (isNaN(number)) {
                    return false;
                }

                return select.includes(`${letter}${number}`);
            } else {
                return select.includes(`${parseInt(st)}`);
            }
        }
    };
};