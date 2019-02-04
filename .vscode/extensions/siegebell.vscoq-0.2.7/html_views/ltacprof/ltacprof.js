// implement cycleNext
(function ($) {
    $.fn.cycleNext = function () {
        const siblings = $(this).parent().children();
        return siblings.eq((siblings.index($(this)) + 1) % siblings.length);
    };
})(jQuery);
/// <reference path="../../typings/index.d.ts" />
// asdasd/// <reference path="jquery.d.ts" />
// asdasd/// <reference path="jqueryui.d.ts" />
// 'use strict';
function getQueryStringValue(key) {
    return decodeURI(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURI(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}
function importStyles(doc) {
    var parentStyleSheets = doc.styleSheets;
    var cssString = "";
    for (var i = 0, count = parentStyleSheets.length; i < count; ++i) {
        if (parentStyleSheets[i].cssRules) {
            var cssRules = parentStyleSheets[i].cssRules;
            for (var j = 0, countJ = cssRules.length; j < countJ; ++j)
                cssString += cssRules[j].cssText;
        }
        else
            cssString += parentStyleSheets[i].cssText; // IE8 and earlier
    }
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = cssString;
    // message(cssString);
    document.getElementsByTagName("head")[0].appendChild(style);
}
function inheritStyles(p) {
    if (p) {
        importStyles(p.document);
        const pp = p.parent;
        if (pp !== p)
            inheritStyles(pp);
    }
}
var connection = null;
function load() {
    if (parent.parent === parent)
        document.body.style.backgroundColor = 'black';
    var address = `ws://${getQueryStringValue('host')}:${getQueryStringValue('port')}`;
    connection = new WebSocket(address);
    // connection.onopen = function (event) {
    //   document.getElementById('stdout').innerHTML = "connected";
    // }
    // connection.onclose = function (event) {
    //   document.getElementById('stdout').innerHTML = "connection closed";
    // }
    // connection.onerror = function (event) {
    //   document.getElementById('stdout').innerHTML = "connection error";
    // }
    connection.onmessage = function (event) {
        const results = JSON.parse(event.data);
        addResults(results);
    };
}
// interface TreeGridSettings {
//   treeColumn?: number,              // 0 	Number of column using for tree
//   initialState?: string,            // expanded 	Initial state of tree
//                                     // 'expanded' - all nodes will be expanded
//                                     // 'collapsed' - all nodes will be collapsed
//   saveState?: boolean,              // false 	If true you can reload page and tree state was saved
//   saveStateMethod?: string,         // cookie 	'cookie' - save state to cookie
//                                     // 'hash' - save state to hash
//   saveStateName?: string,           // tree-grid-state 	Name of cookie or hash to save state.
//   expanderTemplate?: string,        // <span class="treegrid-expander"></span> 	HTML Element when you click on that will be collapse/expand branches
//   expanderExpandedClass?: string,   // treegrid-expander-expanded 	Class using for expander element when it expanded
//   expanderCollapsedClass?: string,  // treegrid-expander-collapsed 	Class using for expander element when it collapsed
//   indentTemplate?: string,          // <span class="treegrid-indent"></span> 	HTML Element that will be placed as padding, depending on the depth of nesting node
//   onCollapse?: ()=>void,            // null 	Function, which will be executed when one of node will be collapsed
//   onExpand?: ()=>void,              // null 	Function, which will be executed when one of node will be expanded
//   onChange?: ()=>void,              // null 	Function, which will be executed when one of node will be expanded or collapsed
// }
// interface FloatTHeadSettings {
//   position?:	string,                     // 'auto'
//   scrollContainer?: (()=>any) | boolean, // null
//   responsiveContainer?: ()=>any,         // null
//   headerCellSelector?:	string,           // 'tr:first>th:visible'
//   floatTableClass?: string,              // 'floatThead-table'
//   floatContainerClass?: string,          // 'floatThead-container'
//   top?: (()=>any) | number,              // 0
//   bottom?:	(()=>any) | number,           // 0
//   zIndex?:	number,                       // 1001
//   debug?:	boolean,                      // false
//   getSizingRow?:	()=>any,                // undefined
//   copyTableClass?:	boolean,              // true
//   enableAria?:	boolean,                  // false
//   autoReflow?:	boolean,                  // false  
// }
// interface StickySettings {
//   topSpacing?: number,              // 0 -- Pixels between the page top and the element's top.
//   bottomSpacing?: number,           // 0 -- Pixels between the page bottom and the element's bottom.
//   className?: string,               // 'is-sticky' -- CSS class added to the element's wrapper when "sticked".
//   wrapperClassName?: string,        // 'sticky-wrapper' -- CSS class added to the wrapper.
//   center?: boolean,                 // false -- Boolean determining whether the sticky element should be horizontally centered in the page.
//   getWidthFrom?: string,            // '' -- Selector of element referenced to set fixed width of "sticky" element.
//   widthFromWrapper?: boolean,       // true -- Boolean determining whether width of the "sticky" element should be updated to match the wrapper's width. Wrapper is a placeholder for "sticky" element while it is fixed (out of static elements flow), and its width depends on the context and CSS rules. Works only as long getWidthForm isn't set.
//   responsiveWidth?: boolean,        // false -- Boolean determining whether widths will be recalculated on window resize (using getWidthfrom).
//   zIndex?: number | string,         // auto -- controls z-index of the sticked element.
// }
// implement cycleNext
// (function($) { $.fn.cycleNext = function() {
//     const siblings = $(this).parent().children();
//     return siblings.eq((siblings.index($(this))+1)%siblings.length);
// } })(jQuery);
// interface JQuery { 
//   // treegrid() : JQuery;
//   // treegrid(settings: TreeGridSettings): JQuery;
//   // treegrid(methodName:'initTree',data: string): JQuery;
//   // treegrid(methodName: string, data: string): JQuery;
//   tbltree() : JQuery;
//   tbltree(settings: TblTreeSettings);
//   tbltree(methodName:'expand', id: JQuery|string, user?: number): JQuery;
//   tbltree(methodName:'collapse', id: JQuery|string, user?: number): JQuery;
//   tbltree(methodName:'toggle', id: JQuery|string): JQuery;
//   tbltree(methodName:'getRow', id: string): JQuery;
//   tbltree(methodName:'getId', row: JQuery): string;
//   tbltree(methodName:'getParentID', row: JQuery): string;
//   tbltree(methodName:'getTreeCell', row: JQuery): JQuery;
//   tbltree(methodName:'_getChildren', row: JQuery): JQuery;
//   tbltree(methodName:'isLeaf', row: JQuery): boolean;
//   tbltree(methodName:'isExpanded', row: JQuery): boolean;
//   tbltree(methodName:'isCollapsed', row: JQuery): boolean;
//   tbltree(methodName:string, param: JQuery|string): any;
//   tbltree(methodName:'getRootNodes'): JQuery;
//   // floatThead() : JQuery;
//   // floatThead(settings: FloatTHeadSettings) : JQuery;
//   // tablesorter(): JQuery;
//   // sticky() : JQuery;
//   // sticky(settings: StickySettings) : JQuery;
//   // sticky(methodName:'update') : JQuery;  
//   // resizableColumns() : JQuery;
//   colResizable() : JQuery;
//   colResizable(settings: {resizeMode?: string, disable?: boolean, disabledColumns?: number[], liveDrag?: boolean, postbackSafe?: boolean, partialRefresh?: boolean, headerOnly?: boolean, innerGripHtml?: string, draggingClass?: string, minWidth?: number, hoverCursor?: string, dragCursor?: string, flush?: boolean, marginLeft?: string, marginRight?: string, onResize?: (e:JQueryEventObject)=>void, onDrag?: ()=>void}) : JQuery;
//   cycleNext(): JQuery;
// }
function sleepFor(sleepDuration) {
    var now = new Date().getTime();
    while (new Date().getTime() < now + sleepDuration) { }
}
function loadResultsTable(results, tbody) {
    let currentId = 0;
    let totalTime = results.total_time;
    function buildTime(time, total, name) {
        if (time == 0)
            return $(document.createElement('td')).text("");
        else {
            const seconds = time.toFixed(3);
            const minutes = (time / 60).toFixed(1);
            const hh = Math.floor(time / 3600);
            const mm = Math.floor((time - hh * 3600) / 60);
            const ss = time - mm * 60;
            const hhmmss = `${hh}:${mm}:${ss.toFixed(1)}`;
            const percent = (time / totalTime * 100).toFixed(1) + "%";
            return $(document.createElement('td'))
                .append($(document.createElement('span')).addClass(name).addClass('seconds').text(seconds).hide())
                .append($(document.createElement('span')).addClass(name).addClass('minutes').text(minutes).hide())
                .append($(document.createElement('span')).addClass(name).addClass('hhmmss').text(hhmmss).hide())
                .append($(document.createElement('span')).addClass(name).addClass('percent').text(percent).show());
        }
    }
    function* buildTacticResultRow(parentId, tactic) {
        ++currentId;
        yield $(document.createElement('tr'))
            .attr('row-id', currentId)
            .map((idx, elm) => parentId > 0 ? $(elm).attr('parent-id', parentId).get() : elm)
            .attr('tabindex', currentId)
            .append($(document.createElement('td')).text(tactic.name))
            .append(buildTime(tactic.statistics.local, totalTime, 'local'))
            .append(buildTime(tactic.statistics.total, totalTime, 'total'))
            .append($(document.createElement('td')).text(tactic.statistics.num_calls))
            .append($(document.createElement('td')).text(tactic.statistics.max_total.toFixed(3)));
        yield* buildTacticsResults(currentId, tactic.tactics);
    }
    function* buildTacticsResults(parentId, tactics) {
        for (let tactic of tactics) {
            yield* buildTacticResultRow(parentId, tactic);
        }
    }
    console.time('load');
    for (let entry of buildTacticsResults(0, results.tactics))
        tbody.append(entry);
    console.timeEnd('load');
    // setTimeout(() => {
    // for(let entry of buildResults(0,result.results)) {
    //   setTimeout(() => {
    //     tbody.append(entry);
    //     // sleepFor(100);
    //   }, 100);
    // }
    // }, 10);
}
function getDescendants(node) {
    const level = node.attr('level');
    return node.nextUntil(`[level=${level}]`, 'tr');
}
function expandNode(node, recursive) {
    // node.treegrid(recursive ? 'expandRecursive' : 'expand');
    if (recursive) {
        getDescendants(node)
            .removeClass('tbltree-collapsed')
            .addClass('tbltree-expanded');
    }
    return $('#results').tbltree('expand', node, 1);
}
function collapseNode(node, recursive) {
    // node.treegrid(recursive ? 'collapseRecursive' : 'collapse');
    if (recursive) {
        getDescendants(node)
            .addClass('tbltree-collapsed')
            .removeClass('tbltree-expanded');
    }
    return $('#results').tbltree('collapse', node, 1);
}
function isExpanded(node) {
    // node.treegrid(recursive ? 'collapseRecursive' : 'collapse');
    return $('#results').tbltree('isExpanded', node);
}
function getParentNode(node) {
    // return node.treegrid)'getParentNode');
    return $('#results').tbltree('getRow', $('#results').tbltree('getParentID', node));
}
let updateResultsAlternatingBackgroundTimer;
function updateResultsAlternatingBackground(delay) {
    if (updateResultsAlternatingBackgroundTimer)
        clearTimeout(updateResultsAlternatingBackgroundTimer);
    if (delay)
        updateResultsAlternatingBackgroundTimer = setTimeout(() => updateResultsAlternatingBackground(), delay);
    else {
        $('#results tr:visible:even').removeClass('result-odd');
        $('#results tr:visible:odd').addClass('result-odd');
    }
}
const currentResults = { total_time: 0, tactics: [] };
function clearResults() {
    currentResults.total_time = 0;
    currentResults.tactics = [];
    let tbody = $('#results tbody');
    if (tbody.length > 0)
        tbody.empty();
}
// function calculateTotalTime(tactic: LtacProfTactic) {
//   tactic.statistics.total
// }
function addResults(results) {
    if (results.total_time === 0) {
        // This could be 0 because of a bug in Coq 8.6 :/
        // Recompute the total by hand...
        currentResults.total_time = results.tactics.map(x => x.statistics.total).reduce((s, v) => s + v, 0);
    }
    currentResults.total_time += results.total_time;
    currentResults.tactics = currentResults.tactics.concat(results.tactics);
    updateResults();
}
function onKeyDown(e) {
    const f = $(':focus');
    switch (e.which) {
        case 39:
            expandNode(f, e.shiftKey);
            break;
        case 37:
            if (isExpanded(f))
                collapseNode(f, e.shiftKey);
            else {
                getParentNode(f).focus();
                collapseNode(getParentNode(f), e.shiftKey);
            }
            break;
        case 38:
            f.prevAll('tr:visible').first().focus();
            break;
        case 40:
            f.nextAll('tr:visible').first().focus();
            break;
        default:
            return;
    }
    e.preventDefault();
}
function updateResults() {
    let tbody = $('#results tbody');
    if (tbody.length > 0)
        tbody.empty();
    else {
        tbody = $('<tbody>');
        $('#results').append(tbody);
        $('#results').keydown(onKeyDown);
        $('#local-unit').change((ev) => {
            const tag = $('#local-unit option:selected').val();
            $('#results span.local').not('.' + tag).hide();
            $('#results span.local').filter('.' + tag).show();
        });
        $('#total-unit').change((ev) => {
            const tag = $('#total-unit option:selected').val();
            $('#results span.total').not('.' + tag).hide();
            $('#results span.total').filter('.' + tag).show();
        });
        $('#local-column').click((ev) => {
            if (ev.target === $('#local-column').get(0))
                $('#local-unit option:selected').prop('selected', false).cycleNext().prop('selected', true);
            $('#local-unit').change();
        });
        $('#total-column').click((ev) => {
            if (ev.target === $('#total-column').get(0))
                $('#total-unit option:selected').prop('selected', false).cycleNext().prop('selected', true);
            $('#total-unit').change();
        });
    }
    loadResultsTable(currentResults, tbody);
    // time('treegrid', () => {
    // $('#results').treegrid({
    //   initialState: 'collapsed',
    //   saveState: false,
    //   onChange: () => {
    //     $('#results tr:visible:even').removeClass('result-odd');
    //     $('#results tr:visible:odd').addClass('result-odd');
    //   }
    // });
    // });
    console.time('tbltree');
    $('#results').tbltree({
        initState: 'collapsed',
        saveState: false,
        change: () => updateResultsAlternatingBackground(50),
    });
    console.timeEnd('tbltree');
    // time('resizable', () => {
    // $('#results')
    //   .css('table-layout','auto')
    //   .resizableColumns()
    //   .css('table-layout','fixed');
    // });
    // time('resizable', () => {
    // $('#results')
    //   .css('table-layout','auto')
    //   .colResizable({
    //     resizeMode: 'fit', liveDrag: true,
    //     // onResize: (e:JQueryEventObject) => {
    //     //   console.log('resize');
    //     //   // $('#sticky-results-header').remove('thead'); //.append($('results thead'));
    //     // } 
    //   })
    //   .css('table-layout','fixed');
    // });
    // $('#results').floatThead('reflow');
    // time('floatThead', () => {
    //   $('#results').floatThead({})
    // });
    // time('sticky', () => {
    //   $('#results thead').sticky({topSpacing: 0, getWidthFrom: '#results'});
    //   $('#results thead').sticky('update');
    // });
    // $('#results tr:visible:even').removeClass('result-odd');
    // $('#results tr:visible:odd').addClass('result-odd');
    updateResultsAlternatingBackground(0);
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9sdGFjcHJvZi9jeWNsZU5leHQuanF1ZXJ5LnRzIiwic3JjL2x0YWNwcm9mL2x0YWNwcm9mLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNCQUFzQjtBQUN0QixDQUFDLFVBQVMsQ0FBQztJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHO1FBQzVCLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BFLENBQUMsQ0FBQTtBQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FDSmIsaURBQWlEO0FBQ2pELDZDQUE2QztBQUM3QywrQ0FBK0M7QUFDL0MsZ0JBQWdCO0FBYWhCLDZCQUE2QixHQUFHO0lBQzVCLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksTUFBTSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsR0FBRyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ25LLENBQUM7QUFFRCxzQkFBc0IsR0FBRztJQUN2QixJQUFJLGlCQUFpQixHQUFvQixHQUFHLENBQUMsV0FBVyxDQUFDO0lBQ3pELElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztJQUNuQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxF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RSxDQUFBO1FBQ3pILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELGdCQUFnQixDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV4QywyQkFBMkI7SUFDM0IsMkJBQTJCO0lBQzNCLCtCQUErQjtJQUMvQixzQkFBc0I7SUFDdEIsc0JBQXNCO0lBQ3RCLCtEQUErRDtJQUMvRCwyREFBMkQ7SUFDM0QsTUFBTTtJQUNOLE1BQU07SUFDTixNQUFNO0lBRU4sT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4QixDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3BCLFNBQVMsRUFBRSxXQUFXO1FBQ3RCLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLE1BQU0sRUFBRSxNQUFNLGtDQUFrQyxDQUFDLEVBQUUsQ0FBQztLQUNyRCxDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBSTNCLDRCQUE0QjtJQUM1QixnQkFBZ0I7SUFDaEIsZ0NBQWdDO0lBQ2hDLHdCQUF3QjtJQUN4QixrQ0FBa0M7SUFDbEMsTUFBTTtJQUVOLDRCQUE0QjtJQUM1QixnQkFBZ0I7SUFDaEIsZ0NBQWdDO0lBQ2hDLG9CQUFvQjtJQUNwQix5Q0FBeUM7SUFDekMsOENBQThDO0lBQzlDLGtDQUFrQztJQUNsQywwRkFBMEY7SUFDMUYsWUFBWTtJQUNaLE9BQU87SUFDUCxrQ0FBa0M7SUFFbEMsTUFBTTtJQUdOLHNDQUFzQztJQUN0Qyw2QkFBNkI7SUFDN0IsaUNBQWlDO0lBQ2pDLE1BQU07SUFFTix5QkFBeUI7SUFDekIsMkVBQTJFO0lBQzNFLDBDQUEwQztJQUMxQyxNQUFNO0lBR04sMkRBQTJEO0lBQzNELHVEQUF1RDtJQUN2RCxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QyxDQUFDIiwiZmlsZSI6Imx0YWNwcm9mLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGxdLCJzb3VyY2VSb290IjoiL2h0bWxfdmlld3MifQ==
