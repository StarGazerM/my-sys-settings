"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defBase64_1 = require("./defBase64");
const version_1 = require("./version");
/**
 * 通过配置获取样式文本
 *
 * @param {object} options 用户配置
 * @param {boolean} useFront 是否前景图
 * @returns {string}
 */
function getStyleByOptions(options, useFront) {
    let styleArr = [];
    for (let k in options) {
        // 在使用背景图时，排除掉 pointer-events
        if (!useFront && ~['pointer-events', 'z-index'].indexOf(k)) {
            continue;
        }
        if (options.hasOwnProperty(k)) {
            styleArr.push(`${k}:${options[k]}`);
        }
    }
    return styleArr.join(';') + ';';
}
/**
 * 生成css样式
 *
 * @export
 * @param {Array<string>} arr 图片数组
 * @param {any} [style={}] 自定义样式
 * @param {Array<any>} [styles=[]] 每个背景图的自定义样式
 * @param {boolean} [useFront=true] 是否用前景图
 * @returns
 */
function default_1(arr, style = {}, styles = [], useFront = true) {
    let [img0, img1, img2] = (arr && arr.length) ?
        [encodeURI(arr[0] || 'none'),
            encodeURI(arr[1] || 'none'),
            encodeURI(arr[2] || 'none')] : defBase64_1.default;
    let defStyle = getStyleByOptions(style, useFront); // 默认样式
    let [styel0, style1, style2] = [
        defStyle + getStyleByOptions(styles[0], useFront),
        defStyle + getStyleByOptions(styles[1], useFront),
        defStyle + getStyleByOptions(styles[2], useFront)
    ];
    // 在前景图时使用 ::after
    let frontContent = useFront ? '::after' : '::before';
    let content = `

/*css-background-start*/
/*background.ver.${version_1.default}*/

[id="workbench.parts.editor"] .split-view-view:nth-child(1) .editor-container .overflow-guard>.monaco-scrollable-element${frontContent}{background-image: url('${img0}');${styel0}}

[id="workbench.parts.editor"] .split-view-view:nth-child(2) .editor-container .overflow-guard>.monaco-scrollable-element${frontContent}{background-image: url('${img1}');${style1}}

[id="workbench.parts.editor"] .split-view-view:nth-child(3) .editor-container .overflow-guard>.monaco-scrollable-element${frontContent}{background-image: url('${img2}');${style2}}

[id="workbench.parts.editor"] .split-view-view .editor-container .overflow-guard>.monaco-scrollable-element>.monaco-editor-background{background: none;}

/*css-background-end*/
`;
    return content;
}
exports.default = default_1;
//# sourceMappingURL=getCss.js.map