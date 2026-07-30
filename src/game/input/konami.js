export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export function createKonami(seq = KONAMI) {
  let buf = []
  return {
    push(key) {
      const k = key.length === 1 ? key.toLowerCase() : key
      buf.push(k)
      if (buf.length > seq.length) buf.shift()
      return buf.length === seq.length && seq.every((v, i) => buf[i] === v)
    },
    reset() { buf = [] },
  }
}
