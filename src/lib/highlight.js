/**
 * A small, dependency-free syntax highlighter.
 * It tokenises with ordered sticky regex rules and returns an array of
 * { type, text } tokens. Unmatched characters are emitted as plain tokens.
 */

const PY_KEYWORDS = 'False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield';
const JS_KEYWORDS = 'const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|new|try|catch|throw|class|extends|of|in|typeof|null|undefined|true|false';

const RULES = {
  python: [
    ['comment', /#[^\n]*/y],
    ['string', /(?:[rbfu]{0,2})(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y],
    ['decorator', /@[\w.]+/y],
    ['keyword', new RegExp(`\\b(?:${PY_KEYWORDS})\\b`, 'y')],
    ['def', /(?<=\b(?:def|class)\s+)[A-Za-z_]\w*/y],
    ['builtin', /\b(?:print|len|str|int|float|dict|list|super|self|Exception|isinstance)\b/y],
    ['number', /\b\d+(?:\.\d+)?\b/y],
    ['func', /\b[A-Za-z_]\w*(?=\()/y],
    ['class', /\b[A-Z][A-Za-z0-9_]*\b/y],
    ['ident', /\b[A-Za-z_]\w*\b/y],
    ['punct', /[{}()[\],.:=*+\-<>/]/y],
  ],
  json: [
    ['property', /"(?:\\.|[^"\\])*"(?=\s*:)/y],
    ['string', /"(?:\\.|[^"\\])*"/y],
    ['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
    ['keyword', /\b(?:true|false|null)\b/y],
    ['comment', /\/\/[^\n]*/y],
    ['punct', /[{}[\],:]/y],
  ],
  javascript: [
    ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ['string', /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
    ['keyword', new RegExp(`\\b(?:${JS_KEYWORDS})\\b`, 'y')],
    ['number', /\b\d+(?:\.\d+)?\b/y],
    ['func', /\b[A-Za-z_$][\w$]*(?=\()/y],
    ['class', /\b[A-Z][A-Za-z0-9_]*\b/y],
    ['ident', /\b[A-Za-z_$][\w$]*\b/y],
    ['punct', /[{}()[\],.:;=+\-<>/!?&|]/y],
  ],
  bash: [
    ['comment', /(?<=^|\s)#[^\n]*/my],
    ['string', /"(?:\\.|[^"\\])*"|'[^']*'/y],
    ['keyword', /\b(?:python|pip|cd|mkdir|source|django-admin|npm|npx|curl)\b/y],
    ['flag', /(?<=\s)--?[\w-]+/y],
    ['ident', /[\w./\\:-]+/y],
    ['punct', /[|&;]/y],
  ],
  http: [
    ['keyword', /(?<=^)(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/my],
    ['property', /(?<=^)[A-Za-z-]+(?=:\s)/my],
    ['string', /HTTP\/\d(?:\.\d)?/y],
    ['number', /\b[1-5]\d\d\b/y],
    ['ident', /\w+/y],
  ],
  text: [],
};

const ALIASES = { py: 'python', js: 'javascript', jsx: 'javascript', sh: 'bash', shell: 'bash', powershell: 'bash' };

export function tokenize(code, lang = 'text') {
  const rules = RULES[ALIASES[lang] || lang] || [];
  const tokens = [];
  let plain = '';
  let i = 0;
  const pushPlain = () => { if (plain) { tokens.push({ type: 'plain', text: plain }); plain = ''; } };
  outer: while (i < code.length) {
    for (const [type, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m.index === i && m[0].length > 0) {
        if (type === 'ident') {
          // identifiers are consumed whole (so keywords never match mid-word) but rendered plain
          plain += m[0];
        } else {
          pushPlain();
          tokens.push({ type, text: m[0] });
        }
        i += m[0].length;
        continue outer;
      }
    }
    plain += code[i];
    i += 1;
  }
  pushPlain();
  return tokens;
}
