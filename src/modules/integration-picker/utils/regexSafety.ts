/**
 * Local copy of the `hasCatastrophicBacktrackingRisk` ReDoS lint from
 * `@stackone/connect-sdk` (connect repo, `connect-sdk/src/connectors/regexSafety.ts`)
 * — the hub deliberately carries no @stackone package dependencies. Keep in sync with
 * the canonical implementation when it changes.
 *
 * Flags a group repeated two or more times (`*`, `+`, `{n,}`, `{n}`/`{n,m}` with
 * max ≥ 2) whose body can match the same text in more than one way: a variable-width
 * quantifier inside it (`(a+)+`, `(a{2,4})+`) or an alternation inside it (`(a|a)+`).
 * Such patterns backtrack exponentially on crafted near-miss input — and the hub runs
 * author patterns on every keystroke. `stackone validate` rejects them at connector
 * build time with the canonical lint; this copy re-guards stored patterns from
 * connectors built before that gate existed, and the legacy TS path that never had it.
 *
 * Catches EXPONENTIAL backtracking only. The quadratic "adjacent unbounded quantifier"
 * shape (`^a+a+$`) is a deliberate false negative here, as in the canonical lint — some
 * live legacy patterns have it. The caller bounds the input length instead
 * (MAX_PATTERN_INPUT_LENGTH in zodSchema.ts), the canonical docstring's own recommendation
 * for that shape.
 */
export const hasCatastrophicBacktrackingRisk = (source: string): boolean => {
    const groups: { hasVariable: boolean; hasAlternation: boolean }[] = [];
    let inClass = false;

    // Sticky flag: anchored match at lastIndex without slicing the source per check.
    const braceQuantifier = /\{(\d+)(?:(,)(\d*))?\}/y;

    const quantifierAt = (
        index: number,
    ): { length: number; variable: boolean; amplifying: boolean } | undefined => {
        const char = source[index];
        if (char === '*' || char === '+') {
            return { length: 1, variable: true, amplifying: true };
        }
        if (char === '?') {
            return { length: 1, variable: true, amplifying: false };
        }
        if (char === '{') {
            braceQuantifier.lastIndex = index;
            const match = braceQuantifier.exec(source);
            if (match) {
                const min = Number(match[1]);
                const max = match[2] === undefined ? min : match[3] ? Number(match[3]) : Infinity;
                return { length: match[0].length, variable: max > min, amplifying: max >= 2 };
            }
        }
        return undefined;
    };

    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (char === '\\') {
            i++;
            continue;
        }
        if (inClass) {
            if (char === ']') {
                inClass = false;
            }
            continue;
        }
        if (char === '[') {
            inClass = true;
            continue;
        }
        if (char === '|') {
            if (groups.length > 0) {
                groups[groups.length - 1].hasAlternation = true;
            }
            continue;
        }
        if (char === '(') {
            groups.push({ hasVariable: false, hasAlternation: false });
            // Skip a group prefix — `(?:`, `(?=`, `(?!`, `(?<=`, `(?<!`, `(?<name>`. The
            // `?` here opens a special group, it is never a quantifier (nothing precedes
            // it to repeat), so it must not mark the group as variable-width. Lookbehind
            // (`(?<=` / `(?<!`) additionally skips the `<`; a named group's `<name>` body
            // is plain chars that fall through harmlessly.
            if (source[i + 1] === '?') {
                const isLookbehind =
                    source[i + 2] === '<' && (source[i + 3] === '=' || source[i + 3] === '!');
                i += isLookbehind ? 2 : 1;
            }
            continue;
        }
        if (char === ')') {
            const closed = groups.pop();
            const quantifier = quantifierAt(i + 1);
            if (quantifier) {
                if (quantifier.amplifying && (closed?.hasVariable || closed?.hasAlternation)) {
                    return true;
                }
                i += quantifier.length;
            }
            if (groups.length > 0) {
                if (quantifier?.variable || closed?.hasVariable) {
                    groups[groups.length - 1].hasVariable = true;
                }
                if (closed?.hasAlternation) {
                    groups[groups.length - 1].hasAlternation = true;
                }
            }
            continue;
        }
        const quantifier = quantifierAt(i);
        if (quantifier) {
            if (quantifier.variable && groups.length > 0) {
                groups[groups.length - 1].hasVariable = true;
            }
            i += quantifier.length - 1;
        }
    }

    return false;
};
