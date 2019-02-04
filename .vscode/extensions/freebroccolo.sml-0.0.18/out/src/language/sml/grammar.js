"use strict";
exports.Cls = {
    alnum: `[:alnum:]`,
    alpha: `[:alpha:]`,
    ascii: `[:ascii:]`,
    blank: `[:blank:]`,
    cntrl: `[:cntrl:]`,
    digit: `[:digit:]`,
    graph: `[:graph:]`,
    lower: `[:lower:]`,
    print: `[:print:]`,
    punct: `[:punct:]`,
    space: `[:space:]`,
    upper: `[:upper:]`,
    word: `[:word:]`,
    xdigit: `[:xdigit:]`,
};
exports.Kwd = {
    ABSTYPE: `abstype`,
    AND: `and`,
    ANDALSO: `andalso`,
    AS: `as`,
    CASE: `case`,
    DATATYPE: `datatype`,
    DO: `do`,
    ELSE: `else`,
    END: `end`,
    EQTYPE: `eqtype`,
    EXCEPTION: `exception`,
    FALSE: `false`,
    FN: `fn`,
    FUN: `fun`,
    FUNCTOR: `functor`,
    HANDLE: `handle`,
    IF: `if`,
    IN: `in`,
    INFIX: `infix`,
    INFIXR: `infixr`,
    INCLUDE: `include`,
    LET: `let`,
    LOCAL: `local`,
    NONFIX: `nonfix`,
    OF: `of`,
    OP: `op`,
    OPEN: `open`,
    ORELSE: `orelse`,
    RAISE: `raise`,
    REC: `rec`,
    SHARING: `sharing`,
    SIG: `sig`,
    SIGNATURE: `signature`,
    STRUCT: `struct`,
    STRUCTURE: `structure`,
    THEN: `then`,
    TRUE: `true`,
    TYPE: `type`,
    VAL: `val`,
    WHERE: `where`,
    WHILE: `while`,
    WITH: `with`,
    WITHTYPE: `withtype`,
};
const decStart = [
    exports.Kwd.ABSTYPE,
    exports.Kwd.AND,
    exports.Kwd.DATATYPE,
    exports.Kwd.EXCEPTION,
    exports.Kwd.FUN,
    exports.Kwd.INFIX,
    exports.Kwd.INFIXR,
    exports.Kwd.LOCAL,
    exports.Kwd.NONFIX,
    exports.Kwd.OPEN,
    exports.Kwd.TYPE,
    exports.Kwd.VAL,
];
const decEnd = [
    ...decStart,
    exports.Kwd.END,
    exports.Kwd.IN,
];
const topdecStart = [
    ...decStart,
    exports.Kwd.INCLUDE,
    exports.Kwd.LOCAL,
    exports.Kwd.FUNCTOR,
    exports.Kwd.SIGNATURE,
    exports.Kwd.STRUCTURE,
];
const topdecEnd = [
    ...topdecStart,
    exports.Kwd.END,
    exports.Kwd.IN,
];
exports.TokSet = {
    decEnd,
    decStart,
    operator: [":", "!", "?", "'", "@", "/", "\\-", "\\*", "\\\\", "\\+", "\\|", "&", "#", "%", "`", "^", "<", "=", ">", "~", "$"],
    topdecEnd,
    topdecStart,
};
exports.alt = (...rest) => rest.join("|");
exports.capture = (arg) => `(${arg})`;
exports.complement = (...rest) => `[^${rest.join("")}]`;
exports.group = (arg) => `(?:${arg})`;
exports.lookBehind = (arg) => `(?<=${arg})`;
exports.negativeLookBehind = (arg) => `(?<!${arg})`;
function lastOps(...rest) {
    const result = [];
    for (const token of rest)
        result.push(`[^${exports.seq(...exports.TokSet.operator)}]${token}`, `^${token}`);
    return exports.alt(...result);
}
exports.lastOps = lastOps;
function lastWords(...rest) {
    const result = [];
    for (const token of rest)
        result.push(`[^[:word:]]${token}`, `^${token}`);
    return exports.alt(...result);
}
exports.lastWords = lastWords;
exports.many = (arg) => `${arg}*`;
exports.manyOne = (arg) => `${arg}+`;
exports.opt = (arg) => `${arg}?`;
exports.words = (arg) => `\\b${arg}\\b`;
exports.ops = (arg) => exports.seq(exports.lookBehind(exports.complement(...exports.TokSet.operator)), arg, exports.lookAhead(exports.complement(...exports.TokSet.operator)));
exports.lookAhead = (arg) => `(?=${arg})`;
exports.negativeLookAhead = (arg) => `(?!=${arg})`;
exports.seq = (...rest) => rest.join("");
exports.set = (...rest) => `[${rest.join("")}]`;
exports.Gph = {
    APOSTROPHE: `'`,
    ASTERISK: `\\*`,
    COLON: `:`,
    COMMA: `,`,
    EQUALS_SIGN: `=`,
    ELLIPSIS: `\\.\\.\\.`,
    FULL_STOP: `\\.`,
    GREATER_THAN_SIGN: `>`,
    HYPHEN_MINUS: `-`,
    LEFT_CURLY_BRACKET: `\\{`,
    LEFT_PARENTHESIS: `\\(`,
    LEFT_SQUARE_BRACKET: `\\[`,
    LOW_LINE: `_`,
    NUMBER_SIGN: `#`,
    RIGHT_CURLY_BRACKET: `\\}`,
    RIGHT_PARENTHESIS: `\\)`,
    RIGHT_SQUARE_BRACKET: `\\]`,
    QUOTATION_MARK: `"`,
    SEMICOLON: `;`,
    VERTICAL_LINE: `\\|`,
};
exports.Rx = {
    boundary: `\\b`,
    expEnd: exports.lookAhead(exports.alt(exports.Gph.COMMA, exports.Gph.RIGHT_CURLY_BRACKET, exports.Gph.RIGHT_PARENTHESIS, exports.Gph.RIGHT_SQUARE_BRACKET, exports.seq(exports.words(exports.group(exports.alt(...exports.TokSet.topdecEnd))), exports.group(exports.alt("$", exports.set(exports.Cls.space), exports.ops(exports.alt(exports.Gph.COMMA, exports.Gph.RIGHT_CURLY_BRACKET, exports.Gph.RIGHT_PARENTHESIS, exports.Gph.RIGHT_SQUARE_BRACKET))))))),
    topdecEndSansType: exports.lookAhead(exports.alt(exports.Gph.RIGHT_CURLY_BRACKET, exports.Gph.RIGHT_PARENTHESIS, exports.Gph.RIGHT_SQUARE_BRACKET, exports.seq(exports.words(exports.group(exports.alt(...exports.TokSet.topdecEnd.filter((x) => x !== exports.Kwd.TYPE)))), exports.group(exports.alt("$", exports.set(exports.Cls.space), exports.ops(exports.alt(exports.Gph.RIGHT_CURLY_BRACKET, exports.Gph.RIGHT_PARENTHESIS, exports.Gph.RIGHT_SQUARE_BRACKET))))))),
    topdecEnd: exports.lookAhead(exports.alt(exports.Gph.RIGHT_CURLY_BRACKET, exports.Gph.RIGHT_PARENTHESIS, exports.Gph.RIGHT_SQUARE_BRACKET, exports.seq(exports.words(exports.group(exports.alt(...exports.TokSet.topdecEnd))), exports.group(exports.alt("$", exports.set(exports.Cls.space), exports.ops(exports.alt(exports.Gph.RIGHT_CURLY_BRACKET, exports.Gph.RIGHT_PARENTHESIS, exports.Gph.RIGHT_SQUARE_BRACKET))))))),
};
exports.operator = exports.seq(exports.set(exports.Cls.alpha), exports.many(exports.set(...exports.TokSet.operator)), exports.group(exports.alt("\\b", exports.lookAhead(exports.set(exports.Cls.space)))));
exports.identifier = exports.seq(exports.set(exports.Cls.alpha), exports.many(exports.set(exports.Cls.alnum, "'", "_")), exports.group(exports.alt("\\b", exports.lookAhead(exports.set(exports.Cls.space)))));
exports.Lex = {
    operator: exports.seq(exports.negativeLookAhead(exports.ops(exports.alt(exports.Gph.VERTICAL_LINE))), exports.manyOne(exports.set(...exports.TokSet.operator))),
    tyvar: exports.seq(exports.negativeLookAhead(exports.words(exports.group(exports.alt(...Object.keys(exports.Kwd).map((key) => exports.Kwd[key]))))), exports.seq(exports.capture(exports.Gph.APOSTROPHE), exports.capture(exports.identifier))),
    vid: exports.seq(exports.negativeLookAhead(exports.words(exports.group(exports.alt(...Object.keys(exports.Kwd).map((key) => exports.Kwd[key]))))), exports.seq("\\b", exports.identifier)),
};
exports.Sco = {
    AND: `variable.other.class.js variable.interpolation storage.modifier message.error`,
    APOSTROPHE: `punctuation.definition.tag`,
    CASE: `keyword.control.switch`,
    COLON: `variable.other.class.js variable.interpolation keyword.operator keyword.control message.error`,
    COMMA: `string.regexp`,
    COMMENT: `comment`,
    CONSTRUCTOR: `entity.other.attribute-name.css constant.language constant.numeric`,
    DELIMITER: `punctuation.definition.tag`,
    DOT: `keyword`,
    FIELD_NAME: `markup.inserted constant.language support.property-value entity.name.filename`,
    FIXITY: `keyword.control`,
    FUN: `storage.type`,
    FUNCTION_NAME: `entity.name.function`,
    FUNCTOR: `variable.other.class.js variable.interpolation keyword.operator keyword.control message.error`,
    INCLUDE: `keyword.control.include`,
    KEYWORD: `keyword`,
    LET: `keyword.control`,
    LOCAL: `keyword.control`,
    MODULE_NAME: `entity.name.class constant.numeric`,
    NUMBER: `constant.numeric`,
    OPEN: `keyword.control.open`,
    OPERATOR: `variable.other.class.js message.error variable.interpolation string.regexp`,
    PATTERN_VARIABLE: `string.other.link variable.language variable.parameter`,
    PUNCTUATION: `string.regexp`,
    RAISE: `keyword.control.throwcatch`,
    REC: `variable.other.class.js variable.interpolation keyword.operator keyword.control message.error`,
    SIG: `variable.other.class.js variable.interpolation keyword.control storage.type message.error`,
    SIGNATURE: `variable.other.class.js variable.interpolation keyword.control storage.type message.error`,
    STRING: `string.double`,
    STRUCTURE: `variable.other.class.js variable.interpolation keyword.control storage.type message.error`,
    STRUCT: `variable.other.class.js variable.interpolation keyword.control storage.type message.error`,
    TYPE_CONSTRUCTOR: `support.type`,
    TYPE_NAME: `entity.name.function`,
    TYPE_OPERATOR: `markup.inserted string.regexp`,
    TYPE_VARIABLE: `variable.parameter string.other.link variable.language`,
    VAL: `storage.type`,
    VERTICAL_LINE: `keyword.control.switch`,
};
exports.appexp = {
    patterns: [
        { include: `#atexp` },
    ],
};
exports.atexp = {
    patterns: [
        { include: `#comment` },
        { include: `#scon` },
        { include: `#constant` },
        {
            begin: exports.ops(exports.Gph.NUMBER_SIGN),
            end: exports.alt(exports.capture(exports.Lex.vid), exports.lookBehind(exports.set(exports.Cls.digit, exports.Gph.QUOTATION_MARK))),
            beginCaptures: {
                0: { name: exports.Sco.OPERATOR },
            },
            endCaptures: {
                1: { name: exports.Sco.FIELD_NAME },
            },
            patterns: [
                { include: `#constantNumber` },
                { include: `#constantString` },
            ],
        },
        {
            begin: exports.words(exports.Kwd.LET),
            end: exports.lookBehind(lastWords(exports.Kwd.END)),
            captures: {
                0: { name: exports.Sco.LET },
            },
            patterns: [
                {
                    begin: exports.lookBehind(lastWords(exports.Kwd.LET)),
                    end: exports.words(exports.Kwd.IN),
                    endCaptures: {
                        0: { name: exports.Sco.LET },
                    },
                    patterns: [
                        { include: `#dec` },
                    ],
                },
                {
                    begin: exports.lookBehind(lastWords(exports.Kwd.IN)),
                    end: exports.words(exports.Kwd.END),
                    endCaptures: {
                        0: { name: exports.Sco.LET },
                    },
                    patterns: [
                        { include: `#exp` },
                    ],
                },
            ],
        },
        {
            begin: exports.Gph.LEFT_CURLY_BRACKET,
            end: exports.Gph.RIGHT_CURLY_BRACKET,
            captures: {
                0: { name: exports.Sco.CONSTRUCTOR },
            },
            patterns: [
                { include: `#exp` },
            ],
        },
        {
            begin: exports.seq(exports.Gph.LEFT_PARENTHESIS, exports.negativeLookAhead(exports.Gph.RIGHT_PARENTHESIS)),
            end: exports.Gph.RIGHT_PARENTHESIS,
            captures: {
                0: { name: exports.Sco.DELIMITER },
            },
            patterns: [
                {
                    begin: exports.ops(exports.Gph.COLON),
                    end: exports.lookAhead(exports.Gph.RIGHT_PARENTHESIS),
                    beginCaptures: {
                        0: { name: exports.Sco.COLON },
                    },
                    patterns: [
                        { include: `#ty` },
                    ],
                },
                { include: `#exp` },
            ],
        },
    ],
};
exports.atpat = {
    patterns: [],
};
exports.comment = {
    begin: exports.seq(exports.Gph.LEFT_PARENTHESIS, exports.Gph.ASTERISK),
    end: exports.seq(exports.Gph.ASTERISK, exports.Gph.RIGHT_PARENTHESIS),
    name: exports.Sco.COMMENT,
    patterns: [
        { include: `#comment` },
    ],
};
exports.conbind = {
    patterns: [
        {
            begin: exports.lookBehind(exports.alt(lastWords(exports.Kwd.EXCEPTION), lastOps(exports.Gph.EQUALS_SIGN, exports.Gph.VERTICAL_LINE))),
            end: exports.alt(exports.capture(exports.words(exports.Kwd.OF)), exports.capture(exports.ops(exports.Gph.VERTICAL_LINE)), exports.Rx.topdecEnd),
            endCaptures: {
                1: { name: exports.Sco.CASE },
                2: { name: exports.Sco.VERTICAL_LINE },
            },
            patterns: [
                { include: `#comment` },
                {
                    match: exports.alt(exports.Lex.operator, exports.Lex.vid),
                    name: exports.Sco.CONSTRUCTOR,
                },
            ],
        },
        {
            begin: exports.lookBehind(lastWords(exports.Kwd.OF)),
            end: exports.alt(exports.ops(exports.Gph.VERTICAL_LINE), exports.Rx.topdecEnd),
            endCaptures: {
                0: { name: exports.Sco.VERTICAL_LINE },
            },
            patterns: [
                { include: `#comment` },
                { include: `#ty` },
            ],
        },
    ],
};
exports.condesc = {
    patterns: [],
};
exports.constant = {
    patterns: [
        { include: `#constantNumber` },
        { include: `#constantString` },
        {
            match: exports.words(exports.alt(exports.Kwd.FALSE, exports.Kwd.TRUE)),
            name: exports.Sco.CONSTRUCTOR,
        },
        { include: `#qualifiedConstant` },
        {
            match: exports.seq(exports.Gph.LEFT_PARENTHESIS, exports.Gph.RIGHT_PARENTHESIS),
            name: exports.Sco.CONSTRUCTOR,
        },
        {
            match: exports.seq(exports.Gph.LEFT_SQUARE_BRACKET, exports.Gph.RIGHT_SQUARE_BRACKET),
            name: exports.Sco.CONSTRUCTOR,
        },
        {
            begin: exports.Gph.LEFT_CURLY_BRACKET,
            end: exports.Gph.RIGHT_CURLY_BRACKET,
            captures: {
                0: { name: exports.Sco.CONSTRUCTOR },
            },
            patterns: [
                { include: `#row` },
            ],
        },
        {
            begin: exports.Gph.LEFT_SQUARE_BRACKET,
            end: exports.Gph.RIGHT_SQUARE_BRACKET,
            captures: {
                0: { name: exports.Sco.CONSTRUCTOR },
            },
            patterns: [
                { include: `#exp` },
            ],
        },
    ],
};
exports.constantNumber = {
    match: exports.seq(exports.negativeLookBehind(exports.set(exports.Cls.alpha)), exports.seq(exports.set(exports.Cls.digit), exports.many(exports.set(exports.Cls.digit))), exports.opt(exports.capture(exports.seq(exports.Gph.FULL_STOP, exports.set(exports.Cls.digit), exports.many(exports.set(exports.Cls.digit)))))),
    name: exports.Sco.NUMBER,
};
exports.constantString = {
    begin: `"`,
    end: `"`,
    name: exports.Sco.STRING,
    patterns: [
        { match: `\\\\"` },
    ],
};
exports.datbind = {
    patterns: [
        {
            begin: exports.lookBehind(lastWords(exports.Kwd.ABSTYPE, exports.Kwd.AND, exports.Kwd.DATATYPE)),
            end: exports.ops(exports.Gph.EQUALS_SIGN),
            endCaptures: {
                0: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#comment` },
                {
                    match: exports.Lex.vid,
                    name: exports.Sco.TYPE_NAME,
                },
                { include: `#ty` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.alt(exports.words(exports.Kwd.AND), exports.Rx.topdecEnd),
            endCaptures: {
                0: { name: exports.Sco.AND },
            },
            patterns: [
                { include: `#conbind` },
            ],
        },
    ],
};
exports.datdesc = {
    patterns: [],
};
exports.dec = {
    patterns: [
        {
            begin: exports.words(exports.Kwd.ABSTYPE),
            end: exports.words(exports.Kwd.END),
            captures: {
                0: { name: exports.Sco.KEYWORD },
            },
        },
        { include: `#decDatatype` },
        { include: `#decException` },
        {
            begin: exports.words(exports.Kwd.FUN),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.FUN },
            },
            patterns: [
                { include: `#fvalbind` },
            ],
        },
        {
            begin: exports.words(exports.group(exports.alt(exports.Kwd.INFIX, exports.Kwd.INFIXR, exports.Kwd.NONFIX))),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.FIXITY },
            },
            patterns: [
                {
                    match: exports.Lex.operator,
                    name: exports.Sco.OPERATOR,
                },
            ],
        },
        {
            begin: exports.words(exports.Kwd.OPEN),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.OPEN },
            },
            patterns: [
                { include: `#qualifiedModule` },
            ],
        },
        { include: `#decType` },
        { include: `#decVal` },
    ],
};
exports.decDatatype = {
    patterns: [
        {
            begin: exports.words(exports.Kwd.DATATYPE),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.KEYWORD },
            },
            patterns: [
                { include: `#datbind` },
            ],
        },
    ],
};
exports.decException = {
    patterns: [
        {
            begin: exports.words(exports.Kwd.EXCEPTION),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.KEYWORD },
            },
            patterns: [
                { include: `#comment` },
                { include: `#conbind` },
            ],
        },
    ],
};
exports.decType = {
    patterns: [
        {
            begin: exports.words(exports.Kwd.TYPE),
            end: exports.alt(exports.Rx.topdecEnd, exports.lookAhead(exports.alt(exports.words(exports.Kwd.WHERE), exports.Gph.EQUALS_SIGN))),
            beginCaptures: {
                0: { name: exports.Sco.KEYWORD },
            },
            patterns: [
                { include: `#typbind` },
            ],
        },
    ],
};
exports.decVal = {
    begin: exports.words(exports.Kwd.VAL),
    end: exports.Rx.topdecEnd,
    beginCaptures: {
        0: { name: exports.Sco.VAL },
    },
    patterns: [
        { include: `#valbind` },
    ],
};
exports.exbind = {
    patterns: [],
};
exports.exdesc = {
    patterns: [],
};
exports.exp = {
    patterns: [
        { include: `#atexp` },
        {
            match: exports.alt(exports.capture(exports.ops(exports.Gph.COMMA)), exports.capture(exports.alt(exports.Gph.SEMICOLON, exports.Lex.operator)), exports.capture(exports.words(exports.Kwd.AS))),
            captures: {
                1: { name: exports.Sco.COMMA },
                2: { name: exports.Sco.OPERATOR },
                3: { name: exports.Sco.KEYWORD },
            },
        },
        {
            begin: exports.words(exports.Kwd.HANDLE),
            end: exports.Rx.expEnd,
            beginCaptures: {
                0: { name: exports.Sco.RAISE },
            },
            patterns: [
                { include: `#match` },
            ],
        },
        {
            match: exports.words(exports.Kwd.RAISE),
            name: exports.Sco.RAISE,
        },
        {
            begin: exports.words(exports.Kwd.FN),
            end: exports.Rx.expEnd,
            beginCaptures: {
                0: { name: exports.Sco.KEYWORD },
            },
            patterns: [
                { include: `#match` },
            ],
        },
        {
            patterns: [
                {
                    begin: exports.words(exports.Kwd.CASE),
                    end: exports.words(exports.Kwd.OF),
                    captures: {
                        0: { name: exports.Sco.CASE },
                    },
                    patterns: [
                        { include: `#exp` },
                    ],
                },
                {
                    begin: exports.lookBehind(lastWords(exports.Kwd.OF)),
                    end: exports.Rx.expEnd,
                    endCaptures: {
                        0: { name: exports.Sco.OPERATOR },
                    },
                    patterns: [
                        { include: `#match` },
                    ],
                },
            ],
        },
        {
            match: exports.words(exports.group(exports.alt(exports.Kwd.IF, exports.Kwd.THEN, exports.Kwd.ELSE))),
            name: exports.Sco.KEYWORD,
        },
        {
            match: exports.words(exports.Kwd.ORELSE),
            name: exports.Sco.OPERATOR,
        },
        {
            match: exports.words(exports.Kwd.ANDALSO),
            name: exports.Sco.OPERATOR,
        },
        {
            match: exports.words(exports.group(exports.alt(exports.Kwd.WHILE, exports.Kwd.DO))),
            name: exports.Sco.KEYWORD,
        },
    ],
};
exports.funbind = {
    patterns: [
        {
            begin: exports.lookBehind(lastWords(exports.Kwd.FUNCTOR, exports.Kwd.AND)),
            end: exports.ops(exports.alt(exports.capture(exports.Gph.COLON), exports.capture(exports.Gph.EQUALS_SIGN))),
            endCaptures: {
                1: { name: exports.Sco.COLON },
                2: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#comment` },
                { include: `#qualifiedModule` },
                {
                    begin: exports.Gph.LEFT_PARENTHESIS,
                    end: exports.Gph.RIGHT_PARENTHESIS,
                    captures: {
                        0: { name: exports.Sco.DELIMITER },
                    },
                    patterns: [
                        { include: `#spec` },
                        {
                            begin: exports.Lex.vid,
                            end: exports.ops(exports.Gph.COLON),
                            beginCaptures: {
                                0: { name: exports.Sco.MODULE_NAME },
                            },
                            endCaptures: {
                                0: { name: exports.Sco.COLON },
                            },
                        },
                        {
                            begin: exports.lookBehind(lastOps(exports.Gph.COLON)),
                            end: exports.lookAhead(exports.Gph.RIGHT_PARENTHESIS),
                            patterns: [
                                { include: `#sigexp` },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.COLON)),
            end: exports.ops(exports.Gph.EQUALS_SIGN),
            endCaptures: {
                0: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#sigexp` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.Rx.topdecEnd,
            endCaptures: {
                0: { name: exports.Sco.KEYWORD },
            },
            patterns: [
                { include: `#strexp` },
            ],
        },
        {
            begin: exports.lookBehind(lastWords(exports.Kwd.AND)),
            end: exports.Rx.topdecEnd,
            endCaptures: {
                0: { name: exports.Sco.KEYWORD },
            },
            patterns: [
                { include: `#funbind` },
            ],
        },
    ],
};
exports.fundec = {
    patterns: [
        { include: `#comment` },
        {
            begin: exports.words(exports.Kwd.FUNCTOR),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.FUNCTOR },
            },
            patterns: [
                { include: `#funbind` },
            ],
        },
    ],
};
exports.fvalbind = {
    patterns: [
        {
            begin: exports.lookBehind(exports.alt(lastOps(exports.Gph.VERTICAL_LINE), lastWords(exports.Kwd.AND, exports.Kwd.FUN))),
            end: exports.ops(exports.alt(exports.capture(exports.Gph.COLON), exports.capture(exports.Gph.EQUALS_SIGN))),
            endCaptures: {
                1: { name: exports.Sco.COLON },
                2: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#comment` },
                {
                    begin: exports.lookBehind(exports.alt(lastOps(exports.Gph.VERTICAL_LINE), lastWords(exports.Kwd.AND, exports.Kwd.FUN))),
                    end: exports.alt(exports.Lex.operator, exports.Lex.vid, exports.lookAhead(exports.complement(exports.Cls.space, exports.Cls.alpha))),
                    endCaptures: {
                        0: { name: exports.Sco.FUNCTION_NAME },
                    },
                },
                { include: `#pat` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.COLON)),
            end: exports.alt(exports.ops(exports.Gph.EQUALS_SIGN), exports.Rx.topdecEnd),
            endCaptures: {
                0: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#ty` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.alt(exports.capture(exports.ops(exports.Gph.VERTICAL_LINE)), exports.capture(exports.words(exports.Kwd.AND)), exports.Rx.topdecEnd),
            endCaptures: {
                1: { name: exports.Sco.VERTICAL_LINE },
                2: { name: exports.Sco.AND },
            },
            patterns: [
                { include: `#exp` },
            ],
        },
    ],
};
exports.infexp = {
    patterns: [
        { include: `#appexp` },
    ],
};
exports.match = {
    patterns: [
        {
            begin: exports.lookBehind(exports.alt(lastWords(exports.Kwd.FN, exports.Kwd.HANDLE, exports.Kwd.OF), lastOps(exports.Gph.VERTICAL_LINE))),
            end: exports.ops(exports.seq(exports.Gph.EQUALS_SIGN, exports.Gph.GREATER_THAN_SIGN)),
            endCaptures: {
                0: { name: exports.Sco.CASE },
            },
            patterns: [
                { include: `#comment` },
                { include: `#pat` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.seq(exports.Gph.EQUALS_SIGN, exports.Gph.GREATER_THAN_SIGN))),
            end: exports.alt(exports.ops(exports.Gph.VERTICAL_LINE), exports.Rx.expEnd),
            endCaptures: {
                0: { name: exports.Sco.VERTICAL_LINE },
            },
            patterns: [
                { include: `#exp` },
            ],
        },
    ],
};
exports.pat = {
    patterns: [
        {
            begin: exports.Gph.LEFT_CURLY_BRACKET,
            end: exports.Gph.RIGHT_CURLY_BRACKET,
            captures: {
                0: { name: exports.Sco.CONSTRUCTOR },
            },
            patterns: [
                { include: `#patrow` },
            ],
        },
        {
            begin: exports.Gph.LEFT_SQUARE_BRACKET,
            end: exports.Gph.RIGHT_SQUARE_BRACKET,
            captures: {
                0: { name: exports.Sco.CONSTRUCTOR },
            },
            patterns: [
                { include: `#pat` },
            ],
        },
        { include: `#constant` },
        {
            match: exports.alt(exports.capture(exports.ops(exports.Gph.COMMA)), exports.capture(exports.Lex.operator), exports.capture(exports.words(exports.Kwd.AS))),
            captures: {
                1: { name: exports.Sco.COMMA },
                2: { name: exports.Sco.OPERATOR },
                3: { name: exports.Sco.KEYWORD },
            },
        },
        {
            match: exports.alt(exports.capture(exports.ops(exports.Gph.LOW_LINE)), exports.capture(exports.seq(exports.lookAhead(exports.set(exports.Cls.lower)), exports.Lex.vid))),
            captures: {
                1: { name: `${exports.Sco.COMMENT} ${exports.Sco.DELIMITER}` },
                2: { name: exports.Sco.PATTERN_VARIABLE },
            },
        },
        {
            begin: exports.Gph.LEFT_PARENTHESIS,
            end: exports.Gph.RIGHT_PARENTHESIS,
            captures: {
                0: { name: exports.Sco.DELIMITER },
            },
            patterns: [
                { include: `#comment` },
                {
                    begin: exports.ops(exports.Gph.COLON),
                    end: exports.lookAhead(exports.Gph.RIGHT_PARENTHESIS),
                    beginCaptures: {
                        0: { name: exports.Sco.COLON },
                    },
                    patterns: [
                        { include: `#ty` },
                    ],
                },
                { include: `#pat` },
            ],
        },
    ],
};
exports.patrow = {
    patterns: [
        {
            begin: exports.lookBehind(exports.alt(exports.Gph.LEFT_CURLY_BRACKET, exports.Gph.COMMA)),
            end: exports.alt(exports.ops(exports.alt(exports.capture(exports.Gph.COMMA), exports.capture(exports.Gph.COLON), exports.capture(exports.Gph.EQUALS_SIGN))), exports.lookAhead(exports.Gph.RIGHT_CURLY_BRACKET)),
            endCaptures: {
                1: { name: exports.Sco.COMMA },
                2: { name: exports.Sco.COLON },
                3: { name: exports.Sco.COLON },
            },
            patterns: [
                {
                    match: exports.Lex.vid,
                    name: exports.Sco.FIELD_NAME,
                },
                {
                    match: exports.ops(exports.Gph.ELLIPSIS),
                    name: exports.Sco.CONSTRUCTOR,
                },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.COLON)),
            end: exports.alt(exports.Gph.COMMA, exports.lookAhead(exports.Gph.RIGHT_CURLY_BRACKET)),
            endCaptures: {
                0: { name: exports.Sco.PUNCTUATION },
            },
            patterns: [
                { include: `#ty` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.alt(exports.Gph.COMMA, exports.lookAhead(exports.Gph.RIGHT_CURLY_BRACKET)),
            endCaptures: {
                0: { name: exports.Sco.COMMA },
            },
            patterns: [
                { include: `#pat` },
            ],
        },
    ],
};
exports.qualifiedConstant = {
    patterns: [
        { include: `#qualifiedPrefix` },
        {
            match: exports.seq(exports.lookAhead(exports.set(exports.Cls.upper)), exports.Lex.vid),
            name: exports.Sco.CONSTRUCTOR,
        },
    ],
};
exports.qualifiedModule = {
    patterns: [
        { include: `#qualifiedPrefix` },
        {
            match: exports.seq(exports.lookAhead(exports.set(exports.Cls.upper)), exports.Lex.vid),
            name: exports.Sco.MODULE_NAME,
        },
    ],
};
exports.qualifiedPrefix = {
    begin: exports.seq(exports.lookAhead(exports.set(exports.Cls.upper)), exports.Lex.vid, exports.lookAhead(exports.seq(exports.many(exports.set(exports.Cls.space)), exports.Gph.FULL_STOP))),
    end: exports.Gph.FULL_STOP,
    beginCaptures: {
        0: { name: exports.Sco.MODULE_NAME },
    },
    endCaptures: {
        0: { name: exports.Sco.DOT },
    },
};
exports.qualifiedType = {
    patterns: [
        { include: `#qualifiedPrefix` },
        {
            match: exports.Lex.vid,
            name: exports.Sco.TYPE_CONSTRUCTOR,
        },
    ],
};
exports.row = {
    patterns: [
        {
            begin: exports.lookBehind(exports.alt(exports.Gph.LEFT_CURLY_BRACKET, exports.Gph.COMMA)),
            end: exports.alt(exports.ops(exports.alt(exports.capture(exports.Gph.COMMA), exports.capture(exports.Gph.COLON), exports.capture(exports.Gph.EQUALS_SIGN))), exports.lookAhead(exports.Gph.RIGHT_CURLY_BRACKET)),
            endCaptures: {
                1: { name: exports.Sco.COMMA },
                2: { name: exports.Sco.COLON },
                3: { name: exports.Sco.COLON },
            },
            patterns: [
                {
                    match: exports.Lex.vid,
                    name: exports.Sco.FIELD_NAME,
                },
                {
                    match: exports.ops(exports.Gph.ELLIPSIS),
                    name: exports.Sco.CONSTRUCTOR,
                },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.COLON)),
            end: exports.alt(exports.Gph.COMMA, exports.lookAhead(exports.Gph.RIGHT_CURLY_BRACKET)),
            endCaptures: {
                0: { name: exports.Sco.PUNCTUATION },
            },
            patterns: [
                { include: `#ty` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.alt(exports.Gph.COMMA, exports.lookAhead(exports.Gph.RIGHT_CURLY_BRACKET)),
            endCaptures: {
                0: { name: exports.Sco.COMMA },
            },
            patterns: [
                { include: `#exp` },
            ],
        },
    ],
};
exports.scon = {
    patterns: [],
};
exports.sigbind = {
    patterns: [
        {
            begin: exports.lookBehind(lastWords(exports.Kwd.SIGNATURE, exports.Kwd.AND)),
            end: exports.ops(exports.Gph.EQUALS_SIGN),
            endCaptures: {
                0: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#comment` },
                { include: `#qualifiedModule` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.alt(exports.words(exports.Kwd.AND), exports.Rx.topdecEnd),
            endCaptures: {
                0: { name: exports.Sco.AND },
            },
            patterns: [
                { include: `#sigexp` },
            ],
        },
        {
            begin: exports.lookBehind(lastWords(exports.Kwd.AND)),
            end: exports.alt(exports.words(exports.Kwd.AND), exports.Rx.topdecEnd),
            endCaptures: {
                0: { name: exports.Sco.AND },
            },
            patterns: [
                { include: `#sigbind` },
            ],
        },
    ],
};
exports.sigdec = {
    patterns: [
        { include: `#comment` },
        {
            begin: exports.words(exports.Kwd.SIGNATURE),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.KEYWORD },
            },
            patterns: [
                { include: `#sigbind` },
            ],
        },
    ],
};
exports.sigexp = {
    patterns: [
        { include: `#comment` },
        {
            begin: exports.words(exports.Kwd.SIG),
            end: exports.words(exports.Kwd.END),
            patterns: [
                { include: `#spec` },
            ],
            captures: {
                0: { name: exports.Sco.SIG },
            },
        },
        {
            begin: exports.alt(exports.lookBehind(lastWords(exports.Kwd.WHERE)), exports.words(exports.Kwd.WHERE)),
            end: exports.alt(exports.capture(exports.words(exports.Kwd.WHERE)), exports.lookAhead(exports.alt(exports.ops(exports.Gph.EQUALS_SIGN), exports.Rx.topdecEndSansType))),
            beginCaptures: {
                0: { name: exports.Sco.KEYWORD },
            },
            endCaptures: {
                1: { name: exports.Sco.KEYWORD },
            },
            patterns: [
                { include: `#decType` },
            ],
        },
        { include: `#qualifiedModule` },
    ],
};
exports.spec = {
    patterns: [
        { include: `#comment` },
        { include: `#decVal` },
        { include: `#decType` },
        { include: `#decDatatype` },
        { include: `#decException` },
        { include: `#strdecStructure` },
        {
            begin: exports.words(exports.Kwd.INCLUDE),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.INCLUDE },
            },
            patterns: [
                { include: `#sigexp` },
            ],
        },
    ],
};
exports.strbind = {
    patterns: [
        {
            begin: exports.lookBehind(lastWords(exports.Kwd.STRUCTURE, exports.Kwd.AND)),
            end: exports.ops(exports.alt(exports.capture(exports.seq(exports.Gph.COLON, exports.opt(exports.Gph.GREATER_THAN_SIGN))), exports.capture(exports.Gph.EQUALS_SIGN))),
            endCaptures: {
                1: { name: exports.Sco.COLON },
                2: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#comment` },
                { include: `#qualifiedModule` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.COLON, exports.seq(exports.Gph.COLON, exports.Gph.GREATER_THAN_SIGN))),
            end: exports.alt(exports.ops(exports.Gph.EQUALS_SIGN), exports.Rx.topdecEnd),
            endCaptures: {
                0: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#sigexp` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.alt(exports.words(exports.Kwd.AND), exports.Rx.topdecEnd),
            endCaptures: {
                0: { name: exports.Sco.AND },
            },
            patterns: [
                { include: `#strexp` },
            ],
        },
    ],
};
exports.strdec = {
    patterns: [
        { include: `#comment` },
        { include: `#dec` },
        { include: `#strdecStructure` },
        {
            begin: exports.words(exports.Kwd.LOCAL),
            end: exports.lookBehind(lastWords(exports.Kwd.END)),
            beginCaptures: {
                0: { name: exports.Sco.LOCAL },
            },
            patterns: [
                {
                    begin: exports.lookBehind(lastWords(exports.Kwd.LOCAL)),
                    end: exports.words(exports.Kwd.IN),
                    endCaptures: {
                        0: { name: exports.Sco.LOCAL },
                    },
                    patterns: [
                        { include: `#dec` },
                        { include: `#strdec` },
                    ],
                },
                {
                    begin: exports.lookBehind(lastWords(exports.Kwd.IN)),
                    end: exports.words(exports.Kwd.END),
                    endCaptures: {
                        0: { name: exports.Sco.LOCAL },
                    },
                    patterns: [
                        { include: `#dec` },
                        { include: `#strdec` },
                    ],
                },
            ],
        },
    ],
};
exports.strdecStructure = {
    patterns: [
        {
            begin: exports.words(exports.Kwd.STRUCTURE),
            end: exports.Rx.topdecEnd,
            beginCaptures: {
                0: { name: exports.Sco.STRUCTURE },
            },
            patterns: [
                { include: `#strbind` },
            ],
        },
    ],
};
exports.strdesc = {
    patterns: [],
};
exports.strexp = {
    patterns: [
        { include: `#comment` },
        {
            begin: exports.words(exports.Kwd.STRUCT),
            end: exports.words(exports.Kwd.END),
            patterns: [
                { include: `#strdec` },
            ],
            beginCaptures: {
                0: { name: exports.Sco.STRUCT },
            },
            endCaptures: {
                0: { name: exports.Sco.STRUCT },
            },
        },
        { include: `#qualifiedModule` },
    ],
};
exports.topdec = {
    patterns: [
        { include: `#strdec` },
        { include: `#sigdec` },
        { include: `#fundec` },
    ],
};
exports.ty = {
    patterns: [
        { include: `#comment` },
        {
            match: exports.Lex.tyvar,
            captures: {
                1: { name: exports.Sco.APOSTROPHE },
                2: { name: exports.Sco.TYPE_VARIABLE },
            },
        },
        {
            begin: exports.Gph.LEFT_CURLY_BRACKET,
            end: exports.Gph.RIGHT_CURLY_BRACKET,
            captures: {
                0: { name: exports.Sco.CONSTRUCTOR },
            },
            patterns: [
                { include: `#row` },
            ],
        },
        {
            match: exports.ops(exports.alt(exports.seq(exports.Gph.HYPHEN_MINUS, exports.Gph.GREATER_THAN_SIGN), exports.Gph.ASTERISK)),
            name: exports.Sco.TYPE_OPERATOR,
        },
        {
            begin: exports.Gph.LEFT_PARENTHESIS,
            end: exports.Gph.RIGHT_PARENTHESIS,
            captures: {
                0: { name: exports.Sco.DELIMITER },
            },
            patterns: [
                { include: `#ty` },
                {
                    match: exports.Gph.COMMA,
                    name: exports.Sco.COMMA,
                },
            ],
        },
        {
            patterns: [
                { include: `#qualifiedType` },
            ],
        },
    ],
};
exports.typbind = {
    patterns: [
        {
            begin: exports.lookBehind(lastWords(exports.Kwd.TYPE)),
            end: exports.alt(exports.Rx.topdecEnd, exports.capture(exports.ops(exports.Gph.EQUALS_SIGN))),
            endCaptures: {
                0: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#comment` },
                {
                    match: exports.Lex.vid,
                    name: exports.Sco.TYPE_NAME,
                },
                { include: `#ty` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.alt(exports.Rx.topdecEnd, exports.lookAhead(exports.alt(exports.words(exports.Kwd.WHERE), exports.Gph.EQUALS_SIGN))),
            patterns: [
                { include: `#comment` },
                { include: `#ty` },
            ],
        },
    ],
};
exports.typdesc = {
    patterns: [],
};
exports.valbind = {
    patterns: [
        {
            begin: exports.lookBehind(exports.alt(lastOps(exports.Gph.VERTICAL_LINE), lastWords(exports.Kwd.AND, exports.Kwd.VAL))),
            end: exports.alt(exports.ops(exports.alt(exports.capture(exports.Gph.COLON), exports.capture(exports.Gph.EQUALS_SIGN))), exports.Rx.topdecEnd),
            endCaptures: {
                1: { name: exports.Sco.COLON },
                2: { name: exports.Sco.COLON },
            },
            patterns: [
                {
                    begin: exports.lookBehind(exports.alt(lastOps(exports.Gph.VERTICAL_LINE), lastWords(exports.Kwd.AND, exports.Kwd.VAL))),
                    end: exports.alt(exports.capture(exports.words(exports.Kwd.REC)), exports.capture(exports.seq(exports.lookAhead(exports.set(exports.Cls.lower)), exports.Lex.vid)), exports.lookAhead(exports.complement(exports.Cls.space, exports.Cls.alpha))),
                    endCaptures: {
                        1: { name: exports.Sco.REC },
                        2: { name: exports.Sco.FUNCTION_NAME },
                    },
                    patterns: [
                        { include: `#pat` },
                    ],
                },
                {
                    begin: exports.lookBehind(lastWords(exports.Kwd.REC)),
                    end: exports.alt(exports.capture(exports.seq(exports.lookAhead(exports.set(exports.Cls.lower)), exports.Lex.vid)), exports.lookAhead(exports.complement(exports.Cls.space, exports.Cls.alpha))),
                    endCaptures: {
                        0: { name: exports.Sco.FUNCTION_NAME },
                    },
                },
                { include: `#pat` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.COLON)),
            end: exports.alt(exports.ops(exports.Gph.EQUALS_SIGN), exports.Rx.topdecEnd),
            endCaptures: {
                0: { name: exports.Sco.COLON },
            },
            patterns: [
                { include: `#ty` },
            ],
        },
        {
            begin: exports.lookBehind(lastOps(exports.Gph.EQUALS_SIGN)),
            end: exports.alt(exports.capture(exports.ops(exports.Gph.VERTICAL_LINE)), exports.capture(exports.words(exports.Kwd.AND)), exports.Rx.topdecEnd),
            endCaptures: {
                1: { name: exports.Sco.VERTICAL_LINE },
                2: { name: exports.Sco.AND },
            },
            patterns: [
                { include: `#exp` },
            ],
        },
    ],
};
exports.valdesc = {
    patterns: [],
};
const grammar = {
    name: `Standard ML`,
    scopeName: `source.sml`,
    fileTypes: [`.fun`, `.sig`, `.sml`, `.cm`, `.lex`, `.grm`],
    patterns: [
        { include: `#topdec` },
    ],
    repository: {
        appexp: exports.appexp,
        atexp: exports.atexp,
        atpat: exports.atpat,
        comment: exports.comment,
        conbind: exports.conbind,
        condesc: exports.condesc,
        constant: exports.constant,
        constantNumber: exports.constantNumber,
        constantString: exports.constantString,
        datbind: exports.datbind,
        datdesc: exports.datdesc,
        dec: exports.dec,
        decDatatype: exports.decDatatype,
        decException: exports.decException,
        decType: exports.decType,
        decVal: exports.decVal,
        exbind: exports.exbind,
        exdesc: exports.exdesc,
        exp: exports.exp,
        funbind: exports.funbind,
        fundec: exports.fundec,
        fvalbind: exports.fvalbind,
        infexp: exports.infexp,
        match: exports.match,
        pat: exports.pat,
        patrow: exports.patrow,
        qualifiedConstant: exports.qualifiedConstant,
        qualifiedModule: exports.qualifiedModule,
        qualifiedPrefix: exports.qualifiedPrefix,
        qualifiedType: exports.qualifiedType,
        row: exports.row,
        scon: exports.scon,
        sigbind: exports.sigbind,
        sigdec: exports.sigdec,
        sigexp: exports.sigexp,
        spec: exports.spec,
        strbind: exports.strbind,
        strdec: exports.strdec,
        strdecStructure: exports.strdecStructure,
        strdesc: exports.strdesc,
        strexp: exports.strexp,
        topdec: exports.topdec,
        ty: exports.ty,
        typbind: exports.typbind,
        typdesc: exports.typdesc,
        valbind: exports.valbind,
        valdesc: exports.valdesc,
    },
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = grammar;
