/* One owner for lobby drawers. No inert dependency: older offline WebViews use focus guards. */
(function (global) {
  'use strict';
  var d=global.document,stack=[],closing=false;
  if(!d)return;
  function visible(el) {
    if(!el||!d.documentElement.contains(el))return false;
    for(var n=el;n&&n.nodeType===1;n=n.parentElement){
      if(n.hidden||n.classList.contains('hidden'))return false;
      var s=global.getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return false;
    }
    return true;
  }
  function blocked() {
    var nodes=d.querySelectorAll('#dialogue,#level,#event,#paused,#result');
    for(var i=0;i<nodes.length;i++)if(visible(nodes[i]))return true;
    return false;
  }
  function focusable(el) {
    return !!el&&visible(el)&&!el.disabled&&el.getAttribute('tabindex')!=='-1';
  }
  function controls(el) {
    return Array.prototype.filter.call(el.querySelectorAll('button,input,select,textarea,a[href],[tabindex]'),focusable);
  }
  function focus(el) {
    if(!focusable(el))return false;
    try{el.focus({preventScroll:true});}catch(e){el.focus();}
    return d.activeElement===el;
  }
  function refreshFocus(el,preferred) {
    if(!el||blocked())return;
    if(focus(preferred))return;
    var all=controls(el);
    if(all.length){focus(all[0]);return;}
    el.setAttribute('tabindex','-1');
    try{el.focus({preventScroll:true});}catch(e){el.focus();}
  }
  function label(el) {
    if(!el.hasAttribute('role'))el.setAttribute('role','dialog');
    el.setAttribute('aria-modal','true');
    if(!el.hasAttribute('aria-labelledby')&&!el.hasAttribute('aria-label')){
      var title=el.querySelector('h2,h3');if(title)el.setAttribute('aria-label',title.textContent.trim());
    }
  }
  function finish(entry,invoke) {
    entry.el.classList.add('hidden');
    if(invoke&&entry.onClose)entry.onClose();
  }
  function restore(entry) {
    if(blocked())return;
    var parent=stack.length&&stack[stack.length-1].el;
    if(focus(entry.returnFocus))return;
    if(parent)refreshFocus(parent);
    else focus(d.getElementById('start'));
  }
  function close(el,opts) {
    opts=opts||{};
    var at=-1;
    for(var i=0;i<stack.length;i++)if(!el||stack[i].el===el)at=i;
    if(at<0){if(el)el.classList.add('hidden');return;}
    var removed=stack.splice(at),entry=removed[0];closing=true;
    try{for(var j=removed.length-1;j>=0;j--)finish(removed[j],opts.invoke!==false);}finally{closing=false;}
    if(opts.restore!==false)restore(entry);
  }
  function closeAll(opts) {
    opts=opts||{};
    if(stack.length)close(stack[0].el,opts);
  }
  function open(el,opts) {
    if(!el)return;opts=opts||{};
    var top=stack.length&&stack[stack.length-1];
    if(top&&top.el===el){el.classList.remove('hidden');refreshFocus(el,opts.initialFocus);return;}
    var launcher=opts.returnFocus||d.activeElement;
    if(!opts.nested){if(stack.length)launcher=stack[0].returnFocus;closeAll({restore:false});}
    label(el);el.classList.remove('hidden');
    stack.push({el:el,returnFocus:launcher,onClose:opts.onClose});
    refreshFocus(el,opts.initialFocus);
  }
  function active(){return stack.length?stack[stack.length-1].el:null;}
  d.addEventListener('keydown',function(e){
    if(e.key!=='Escape'&&e.key!=='Tab')return;
    var el=active();if(!el||blocked())return;
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(el);return;}
    var all=controls(el),at=all.indexOf(d.activeElement);
    e.preventDefault();e.stopPropagation();
    if(!all.length){refreshFocus(el);return;}
    focus(all[at<0?0:(at+(e.shiftKey?-1:1)+all.length)%all.length]);
  },true);
  d.addEventListener('focusin',function(e){
    if(closing||blocked())return;
    var top=stack.length&&stack[stack.length-1];
    if(top&&visible(top.el)&&!top.el.contains(e.target))refreshFocus(top.el);
  },true);
  global.SakurayoUI={open:open,close:close,closeAll:closeAll,refreshFocus:refreshFocus,active:active};
})(window);
