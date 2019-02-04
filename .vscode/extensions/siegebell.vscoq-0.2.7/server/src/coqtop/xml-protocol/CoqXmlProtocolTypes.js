'use strict';
class ProtocolTypeBase {
}
exports.ProtocolTypeBase = ProtocolTypeBase;
function encode(value) {
    if (value instanceof ProtocolTypeBase)
        return value.encode();
    else if (value instanceof Array)
        return `<list>${value.map((v) => encode(v)).join('')}</list>`;
    else if (typeof value === 'string')
        return `<string>${value}</string>`;
    else if (typeof value === 'number')
        return `<int>${value}</int>`;
    else if (typeof value === 'boolean')
        return `<bool val="${value}"/>`;
}
exports.encode = encode;
class Pair extends ProtocolTypeBase {
    constructor(v1, v2) {
        super();
        this.value = [v1, v2];
    }
    encode() {
        return `<pair>${encode(this.value[0])}${encode(this.value[1])}</pair>`;
    }
}
exports.Pair = Pair;
class Option extends ProtocolTypeBase {
    constructor(value) {
        super();
        this.value = value;
    }
    isNone() {
        return this.value === undefined;
    }
    isSome() {
        return this.value !== undefined;
    }
    encode() {
        if (this.isSome())
            return `<option val="some">${encode(this.value)}</option>`;
        else
            return `<option val="none"></option>`;
    }
}
exports.Option = Option;
/** This is the stupidest type *EVER*. Wtf were they thinking?! */
class OptionValue extends ProtocolTypeBase {
    constructor(value) {
        super();
        this.value = value;
    }
    encode() {
        if (this.value instanceof Option && typeof this.value.value === 'string')
            return `<option_value val="stringoptvalue">${this.value.encode()}</option_value>`;
        else if (this.value instanceof Option && typeof this.value.value === 'number')
            return `<option_value val="intvalue">${this.value.encode()}</option_value>`;
        else if (typeof this.value === 'number')
            return `<option_value val="intvalue">${encode(new Option(this.value))}</option_value>`;
        else if (typeof this.value === 'boolean')
            return `<option_value val="boolvalue">${encode(this.value)}</option_value>`;
        else if (typeof this.value === 'string')
            return `<option_value val="stringvalue">${encode(this.value)}</option_value>`;
    }
}
exports.OptionValue = OptionValue;
class OptionBoolValue extends ProtocolTypeBase {
    constructor(value) {
        super();
        this.value = value;
    }
    encode() {
        return `<option_value val="boolvalue"><bool val="${this.value ? "true" : "false"}"/></option_value>`;
    }
}
exports.OptionBoolValue = OptionBoolValue;
class Unit extends ProtocolTypeBase {
    encode() {
        return `<unit/>`;
    }
}
exports.Unit = Unit;
class Unknown extends ProtocolTypeBase {
    constructor(value) {
        super();
        this.value = value;
    }
    encode() {
        return encode(this.value);
    }
}
exports.Unknown = Unknown;
class Status extends ProtocolTypeBase {
    constructor(
        /** Module path of the current proof */
        path, 
        /** Current proof name. `None` if no focussed proof is in progress */
        proofName, 
        /** List of all pending proofs. Order is not significant */
        allProofs, 
        /** An id describing the state of the current proof. */
        proofNumber) {
        super();
        this.path = path;
        this.proofName = proofName;
        this.allProofs = allProofs;
        this.proofNumber = proofNumber;
    }
    // static decode(path: ProtocolType, proofName: ProtocolType, allProofs: ProtocolType, proofNumber: ProtocolType) : Status|Unknown {
    //   if(path instanceof Array && typeof path[0] === 'string' &&
    //     proofName instance)
    // }
    encode() {
        return `<status>${encode(this.path)}${encode(this.proofName)}${encode(this.allProofs)}${encode(this.proofNumber)}</status>`;
    }
}
exports.Status = Status;
//# sourceMappingURL=CoqXmlProtocolTypes.js.map