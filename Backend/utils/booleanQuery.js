const OPERATORS = {
    NOT: { precedence: 3, arity: 1 },
    AND: { precedence: 2, arity: 2 },
    OR: { precedence: 1, arity: 2 },
};

const tokenize = (input = '') => {
    return input
        .replace(/[()]/g, (match) => ` ${match} `)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => token.toUpperCase() in OPERATORS || token === '(' || token === ')' ? token.toUpperCase() : token);
};

const toPostfix = (tokens) => {
    const output = [];
    const stack = [];

    for (const token of tokens) {
        if (token in OPERATORS) {
            const { precedence } = OPERATORS[token];
            while (stack.length) {
                const top = stack[stack.length - 1];
                if (top in OPERATORS && OPERATORS[top].precedence >= precedence) {
                    output.push(stack.pop());
                } else {
                    break;
                }
            }
            stack.push(token);
        } else if (token === '(') {
            stack.push(token);
        } else if (token === ')') {
            while (stack.length && stack[stack.length - 1] !== '(') {
                output.push(stack.pop());
            }
            stack.pop();
        } else {
            output.push(token);
        }
    }

    while (stack.length) {
        output.push(stack.pop());
    }

    return output;
};

export const evaluateBooleanQuery = (query, text) => {
    if (!query) return true;
    const tokens = tokenize(query);
    if (!tokens.length) return true;
    const postfix = toPostfix(tokens);
    const stack = [];
    const haystack = text.toLowerCase();

    for (const token of postfix) {
        if (token in OPERATORS) {
            const { arity } = OPERATORS[token];
            if (arity === 1) {
                const value = stack.pop() ?? false;
                stack.push(!value);
            } else {
                const right = stack.pop() ?? false;
                const left = stack.pop() ?? false;
                stack.push(token === 'AND' ? left && right : left || right);
            }
        } else {
            stack.push(haystack.includes(token.toLowerCase()));
        }
    }

    return Boolean(stack.pop());
};

export const sanitizeQuery = (query = '') => query.replace(/[^\w\s()]/g, ' ').trim();
