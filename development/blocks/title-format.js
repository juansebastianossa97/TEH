// Exhibition names share one format however they are typed:
// each word capitalized, Spanish/English connectors in lowercase (except the first word),
// Roman numerals kept in capitals. «HACIENDA CAÑASGORDAS» -> «Hacienda Cañasgordas».
const connectors = new Set(['de','del','la','las','el','los','lo','y','e','o','u','a','al','en','por','para','con','sin','sobre','entre','of','the','and','in','on','at','to']);
const roman = /^(?=[IVX]{2,5}$)X{0,3}(IX|IV|V?I{0,3})$/;
export function formatTitle(value = '') {
  let first = true;
  return String(value).trim().replace(/\s+/g, ' ').replace(/[\p{L}\p{N}'’]+/gu, word => {
    const isFirst = first; first = false;
    if (roman.test(word)) return word;
    const lower = word.toLocaleLowerCase('es');
    if (!isFirst && connectors.has(lower)) return lower;
    return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
  });
}
