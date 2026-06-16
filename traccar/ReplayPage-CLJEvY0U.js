import{i as e}from"./chunk-aKtaBQYM.js";import{C as t,E as n,F as r,Ft as i,G as useThemeHook,H as a,L as o,N as s,Nt as c,R as l,T as u,V as d,W as f,Y as p,at as m,et as h,it as g,ot as _,t as v,tt as ee,vt as y,z as b}from"./mui-BgU4WrXF.js";import{D as x,N as te,O as S,g as ne,h as re,m as C,o as ie}from"./List-C_tzGiQy.js";import{d as w,l as T,t as E}from"./IconButton-oialqkv3.js";import{n as ae}from"./useControlled-o7n9RX7U.js";import{t as D}from"./Typography-7EcQ2i3p.js";import{t as O}from"./ReportFilter-CtusU-vs.js";import{K as k,lt as A,o as j,pt as M,r as N,w as P,yt as F}from"./index-bel1r0Sr.js";import{t as oe}from"./BackIcon-CSBDQ_HZ.js";import{t as I,n as mapInstance}from"./MapView-Bhqzv-Oc.js";import{t as L}from"./MapGeofence-B_elFORD.js";import{t as R}from"./MapPositions-DtWkadAy.js";import{t as z}from"./MapOverlay-B3a5tfdI.js";import{t as B}from"./MapScale-BXKn6Q3F.js";import{t as V}from"./MapCamera-iXfOxITp.js";import{t as H}from"./PlayArrow-CQJ5eVef.js";import{t as U}from"./MapRoutePath-DaJlD9QK.js";import{t as W}from"./MapRoutePoints-CUx_dHeJ.js";import{t as MapGeocoder}from"./MapGeocoder-DZ7GyHA9.js";import { ResponsiveContainer, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Brush, Line } from "./ChartReportPage-B-RkS5Kp.js?v=2";var se={border:0,clip:`rect(0 0 0 0)`,height:`1px`,margin:`-1px`,overflow:`hidden`,padding:0,position:`absolute`,whiteSpace:`nowrap`,width:`1px`};function G(e,t,n=(e,t)=>e===t){return e.length===t.length&&e.every((e,r)=>n(e,t[r]))}var K=e(i(),1),q=2,J=[],ce={};function Y(e,t,n,r,i){return n===1?Math.min(e+t,i):Math.max(e-t,r)}function le(e,t){return e-t}function ue(e,t,n=-1){let{index:r}=e.reduce((e,n,r)=>{let i=Math.abs(t-n);return e==null||i<=e.distance?{distance:i,index:r}:e},null)??ce;return r==null?r:n>=0&&e[n]===e[r]?n:r}function de(e,t){if(t.current!=null&&e.changedTouches){let n=e;for(let e=0;e<n.changedTouches.length;e+=1){let r=n.changedTouches[e];if(r.identifier===t.current)return{x:r.clientX,y:r.clientY}}return!1}return{x:e.clientX,y:e.clientY}}function fe(e,t,n){return(e-t)*100/(n-t)}function pe(e,t,n){return(n-t)*e+t}function me(e){if(Math.abs(e)<1){let t=e.toExponential().split(`e-`),n=t[0].split(`.`)[1];return(n?n.length:0)+parseInt(t[1],10)}let t=e.toString().split(`.`)[1];return t?t.length:0}function he(e,t,n){let r=Math.round((e-n)/t)*t+n;return Number(r.toFixed(me(t)))}function ge(e,t,n){let r=e.slice();return r[n]=t,r.sort(le)}function _e(e,t,n,r){let i=S(x(e.current));if(!ie(e.current,i)||Number(i?.getAttribute(`data-index`))!==t){let n=e.current?.querySelector(`[type="range"][data-index="${t}"]`);n!=null&&(r==null?n.focus({preventScroll:!0}):n.focus({preventScroll:!0,focusVisible:r}))}n&&n(t)}function ve(e,t){return typeof e==`number`&&typeof t==`number`?e===t:typeof e==`object`&&typeof t==`object`?G(e,t):!1}var ye={horizontal:{offset:e=>({left:`${e}%`}),leap:e=>({width:`${e}%`})},"horizontal-reverse":{offset:e=>({right:`${e}%`}),leap:e=>({width:`${e}%`})},vertical:{offset:e=>({bottom:`${e}%`}),leap:e=>({height:`${e}%`})}},be=e=>e;function xe(e){let{"aria-labelledby":t,defaultValue:n,disabled:i=!1,disableSwap:a=!1,isRtl:o=!1,marks:c=!1,max:l=100,min:d=0,name:f,onChange:p,onChangeCommitted:m,orientation:g=`horizontal`,rootRef:_,scale:v=be,step:y=1,shiftStep:b=10,tabIndex:te,value:ne}=e,C=K.useRef(void 0),w=K.useRef(null),[T,E]=K.useState(-1),[D,O]=K.useState(-1),[k,A]=K.useState(!1),j=K.useRef(0),M=K.useRef(-1),N=K.useRef(!1),P=K.useRef(-1),F=r(()=>{w.current!=null&&(cancelAnimationFrame(w.current),w.current=null)}),oe=K.useRef(null),[I,L]=ae({controlled:ne,default:n??d,name:`Slider`}),R=r((e,t,n)=>{let r=`nativeEvent`in e?e.nativeEvent:e,i=new r.constructor(r.type,r);Object.defineProperty(i,"target",{writable:!0,value:{value:t,name:f}}),oe.current=t,p?.(i,t,n)}),z=Array.isArray(I),B=K.useMemo(()=>{if(typeof I==`number`)return[h(I,d,l)];if(I==null)return[d];let e=I.slice().sort(le);for(let t=0;t<e.length;t+=1){let n=e[t];e[t]=n==null?d:h(n,d,l)}return e},[I,d,l]),V=K.useMemo(()=>{if(c===!0&&y!=null){let e=Array(Math.floor((l-d)/y)+1);for(let t=0;t<e.length;t+=1)e[t]={value:d+y*t};return e}return Array.isArray(c)?c:J},[c,y,d,l]),H=K.useMemo(()=>{let e=Array(V.length);for(let t=0;t<V.length;t+=1)e[t]=V[t].value;return e},[V]),[U,W]=K.useState(-1),G=K.useRef(null),me=s(_,G),xe=e=>t=>{let n=Number(t.currentTarget.getAttribute(`data-index`));u(t.target)&&W(n),O(n),e?.onFocus?.(t)},Se=e=>t=>{u(t.target)||W(-1),O(-1),e?.onBlur?.(t)},X=(e,t)=>{let n=Number(e.currentTarget.getAttribute(`data-index`)),r=B[n],i=H.indexOf(r),o=t;if(V&&y==null){let e=H[H.length-1];o=o>=e?e:o<=H[0]?H[0]:o<r?H[i-1]:H[i+1]}if(o=h(o,d,l),z){a&&(o=h(o,B[n-1]||-1/0,B[n+1]||1/0));let e=o;o=ge(B,o,n);let t=n;a||(t=o.indexOf(e)),_e(G,t)}L(o),W(n),p&&!ve(o,I)&&R(e,o,n),m&&m(e,oe.current??o)},Z=e=>t=>{if([`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`PageUp`,`PageDown`,`Home`,`End`].includes(t.key)){t.preventDefault();let e=B[Number(t.currentTarget.getAttribute(`data-index`))],n=null;if(y!=null){let r=t.shiftKey?b:y;switch(t.key){case`ArrowUp`:n=Y(e,r,1,d,l);break;case`ArrowRight`:n=Y(e,r,o?-1:1,d,l);break;case`ArrowDown`:n=Y(e,r,-1,d,l);break;case`ArrowLeft`:n=Y(e,r,o?1:-1,d,l);break;case`PageUp`:n=Y(e,b,1,d,l);break;case`PageDown`:n=Y(e,b,-1,d,l);break;case`Home`:n=d;break;case`End`:n=l;break;default:break}}else if(V){let r=H[H.length-1],i=H.indexOf(e),a=[o?`ArrowRight`:`ArrowLeft`,`ArrowDown`,`PageDown`,`Home`],s=[o?`ArrowLeft`:`ArrowRight`,`ArrowUp`,`PageUp`,`End`];a.includes(t.key)?n=i===0?H[0]:H[i-1]:s.includes(t.key)&&(n=i===H.length-1?r:H[i+1])}n!=null&&X(t,n)}e?.onKeyDown?.(t)};ee(()=>{let e=S(x(G.current));i&&ie(G.current,e)&&e!=null&&`blur`in e&&e.blur()},[i]),i&&T!==-1&&E(-1),i&&U!==-1&&W(-1);let Ce=e=>t=>{e.onChange?.(t),X(t,t.currentTarget.valueAsNumber)},we=K.useRef(void 0),Te=g;o&&g===`horizontal`&&(Te+=`-reverse`);let Ee=e=>{let{current:t}=G;if(!t)return null;let{width:n,height:r,bottom:i,left:o}=t.getBoundingClientRect(),s;s=Te.startsWith(`vertical`)?(i-e.y)/r:(e.x-o)/n,Te.includes(`-reverse`)&&(s=1-s);let c;c=pe(s,d,l),c=y?he(c,y,d):H[ue(H,c)],c=h(c,d,l);let u=0;if(z){let e=we.current!==-1;u=e?we.current:ue(B,c,M.current),a&&(c=h(c,B[u-1]||-1/0,B[u+1]||1/0));let t=c;c=ge(B,c,u),a&&e||(u=c.indexOf(t),we.current=u)}return{newValue:c,activeIndex:u}},De=r(e=>{if(`pointerId`in e&&e.pointerId!==P.current)return;let t=de(e,C);if(!t)return;if(j.current+=1,e.type===`pointermove`&&e.buttons===0){Q(e);return}let n=Ee(t);n&&(_e(G,n.activeIndex,E,!1),M.current=n.activeIndex,L(n.newValue),!k&&j.current>q&&A(!0),p&&!ve(n.newValue,I)&&R(e,n.newValue,n.activeIndex))}),Q=r(e=>{if(`pointerId`in e&&e.pointerId!==P.current)return;let t=de(e,C);if(A(!1),!t)return;let n=Ee(t);E(-1),e.type===`touchend`&&O(-1),n&&m&&m(e,oe.current??n.newValue),`pointerType`in e&&G.current?.hasPointerCapture(e.pointerId)&&G.current.releasePointerCapture(e.pointerId),C.current=void 0,P.current=-1,$()}),Oe=r(e=>{if(i)return;if(N.current){N.current=!1;let t=e.changedTouches[0];t!=null&&(C.current=t.identifier);return}let t=e.changedTouches[0];t!=null&&(C.current=t.identifier);let n=de(e,C);if(n!==!1){we.current=-1;let t=Ee(n);t&&(_e(G,t.activeIndex,E,!1),M.current=t.activeIndex,L(t.newValue),p&&!ve(t.newValue,I)&&R(e,t.newValue,t.activeIndex))}j.current=0;let r=x(G.current);r.addEventListener(`touchmove`,De,{passive:!0}),r.addEventListener(`touchend`,Q,{passive:!0})}),$=K.useCallback(()=>{let e=x(G.current);e.removeEventListener(`pointermove`,De),e.removeEventListener(`pointerup`,Q),e.removeEventListener(`touchmove`,De),e.removeEventListener(`touchend`,Q)},[Q,De]);K.useEffect(()=>{let e=G.current;if(e)return e.addEventListener(`touchstart`,Oe,{passive:!0}),()=>{e.removeEventListener(`touchstart`,Oe),F(),$()}},[$,Oe,F]),K.useEffect(()=>{i&&($(),F())},[i,$,F]);let ke=e=>t=>{if(e.onPointerDown?.(t),t.pointerType===`touch`&&(N.current=!0),i||t.defaultPrevented||t.button!==0)return;let n=de(t,C);if(n!==!1){we.current=-1;let e=Ee(n);if(e){let n=G.current?.querySelector(`input[type="range"][data-index="${e.activeIndex}"]`),r=x(G.current),i=n!=null&&n===S(r);E(e.activeIndex),M.current=e.activeIndex,i?t.preventDefault():(F(),w.current=requestAnimationFrame(()=>{w.current=null,_e(G,e.activeIndex,void 0,!1)})),L(e.newValue),p&&!ve(e.newValue,I)&&R(t,e.newValue,e.activeIndex)}}j.current=0,P.current=t.pointerId;let r=x(G.current);try{t.currentTarget.setPointerCapture(t.pointerId)}catch{}r.addEventListener(`pointermove`,De,{passive:!0}),r.addEventListener(`pointerup`,Q)},Ae=fe(z?B[0]:d,d,l),je=fe(B[B.length-1],d,l)-Ae,Me=(e=ce)=>{let t=re(e),n={onPointerDown:ke(t)},r={...t,...n};return{...e,ref:me,...r}},Ne=e=>t=>{e.onMouseOver?.(t),O(Number(t.currentTarget.getAttribute(`data-index`)))},Pe=e=>t=>{e.onMouseLeave?.(t),O(-1)},Fe=(e=ce)=>{let t=re(e),n={onMouseOver:Ne(t),onMouseLeave:Pe(t)};return{...e,...t,...n}},Ie=e=>{let t;return z?T===e?t=2:M.current===e&&(t=1):T===e&&(t=1),{pointerEvents:T!==-1&&T!==e?`none`:void 0,zIndex:t}},Le;return g===`vertical`&&(Le=o?`vertical-rl`:`vertical-lr`),{active:T,axis:Te,axisProps:ye,dragging:k,focusedThumbIndex:U,getHiddenInputProps:(n=ce)=>{let r=re(n),a={onChange:Ce(r),onFocus:xe(r),onBlur:Se(r),onKeyDown:Z(r)},s={...r,...a};return{tabIndex:te,"aria-labelledby":t,"aria-orientation":g,"aria-valuemax":v(l),"aria-valuemin":v(d),name:f,type:`range`,min:e.min,max:e.max,step:e.step===null&&e.marks?`any`:e.step??void 0,disabled:i,...n,...s,style:{...se,direction:o?`rtl`:`ltr`,width:`100%`,height:`100%`,writingMode:Le}}},getRootProps:Me,getThumbProps:Fe,marks:V,open:D,range:z,rootRef:me,trackLeap:je,trackOffset:Ae,values:B,getThumbStyle:Ie}}function Se(e){return m(`MuiSlider`,e)}var X=g(`MuiSlider`,`root.active.colorPrimary.colorSecondary.colorError.colorInfo.colorSuccess.colorWarning.disabled.dragging.focusVisible.mark.markActive.marked.markLabel.markLabelActive.rail.sizeSmall.thumb.track.trackInverted.trackFalse.valueLabel.valueLabelOpen.valueLabelCircle.valueLabelLabel.vertical`.split(`.`)),Z=y(),Ce=e=>{let{open:t}=e;return{offset:_(t&&X.valueLabelOpen),circle:X.valueLabelCircle,label:X.valueLabelLabel}};function we(e){let{children:t,className:n,value:r}=e,i=Ce(e);return t?K.cloneElement(t,{className:t.props.className},(0,Z.jsxs)(K.Fragment,{children:[t.props.children,(0,Z.jsx)(`span`,{className:_(i.offset,n),"aria-hidden":!0,children:(0,Z.jsx)(`span`,{className:i.circle,children:(0,Z.jsx)(`span`,{className:i.label,children:r})})})]})):null}function Te(e){return e}var Ee=a(`span`,{name:`MuiSlider`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[`color${d(n.color)}`],n.size!==`medium`&&t[`size${d(n.size)}`],n.marked&&t.marked,n.orientation===`vertical`&&t.vertical,n.track===`inverted`&&t.trackInverted,n.track===!1&&t.trackFalse]}})(b(({theme:e})=>({borderRadius:12,boxSizing:`content-box`,display:`inline-block`,position:`relative`,cursor:`pointer`,touchAction:`none`,WebkitTapHighlightColor:`transparent`,"@media print":{colorAdjust:`exact`},[`&.${X.disabled}`]:{pointerEvents:`none`,cursor:`default`,color:(e.vars||e).palette.grey[400]},[`&.${X.dragging}`]:{[`& .${X.thumb}, & .${X.track}`]:{transition:`none`}},variants:[...Object.entries(e.palette).filter(t()).map(([t])=>({props:{color:t},style:{color:(e.vars||e).palette[t].main}})),{props:{orientation:`horizontal`},style:{height:4,width:`100%`,padding:`13px 0`,"@media (pointer: coarse)":{padding:`20px 0`}}},{props:{orientation:`horizontal`,size:`small`},style:{height:2}},{props:{orientation:`horizontal`,marked:!0},style:{marginBottom:20}},{props:{orientation:`vertical`},style:{height:`100%`,width:4,padding:`0 13px`,"@media (pointer: coarse)":{padding:`0 20px`}}},{props:{orientation:`vertical`,size:`small`},style:{width:2}},{props:{orientation:`vertical`,marked:!0},style:{marginRight:44}}]}))),De=a(`span`,{name:`MuiSlider`,slot:`Rail`})({display:`block`,position:`absolute`,borderRadius:`inherit`,backgroundColor:`currentColor`,opacity:.38,"@media (forced-colors: active)":{border:`1px solid transparent`,boxSizing:`border-box`},variants:[{props:{orientation:`horizontal`},style:{width:`100%`,height:`inherit`,top:`50%`,transform:`translateY(-50%)`}},{props:{orientation:`vertical`},style:{height:`100%`,width:`inherit`,left:`50%`,transform:`translateX(-50%)`}},{props:{track:`inverted`},style:{opacity:1}}]}),Q=a(`span`,{name:`MuiSlider`,slot:`Track`})(b(({theme:e})=>({display:`block`,position:`absolute`,borderRadius:`inherit`,border:`1px solid currentColor`,backgroundColor:`currentColor`,transition:e.transitions.create([`left`,`width`,`bottom`,`height`],{duration:e.transitions.duration.shortest}),variants:[{props:{size:`small`},style:{"@media (forced-colors: none)":{border:`none`}}},{props:{orientation:`horizontal`},style:{height:`inherit`,top:`50%`,transform:`translateY(-50%)`}},{props:{orientation:`vertical`},style:{width:`inherit`,left:`50%`,transform:`translateX(-50%)`}},{props:{track:!1},style:{display:`none`}},...Object.entries(e.palette).filter(t()).map(([t])=>({props:{color:t,track:`inverted`},style:{...e.vars?{backgroundColor:e.vars.palette.Slider[`${t}Track`],borderColor:e.vars.palette.Slider[`${t}Track`]}:{backgroundColor:e.lighten(e.palette[t].main,.62),borderColor:e.lighten(e.palette[t].main,.62),...e.applyStyles(`dark`,{backgroundColor:e.darken(e.palette[t].main,.5)}),...e.applyStyles(`dark`,{borderColor:e.darken(e.palette[t].main,.5)})}}}))]}))),Oe=a(`span`,{name:`MuiSlider`,slot:`Thumb`})(b(({theme:e})=>({position:`absolute`,width:20,height:20,boxSizing:`border-box`,borderRadius:`50%`,outline:0,backgroundColor:`currentColor`,display:`flex`,alignItems:`center`,justifyContent:`center`,transition:e.transitions.create([`box-shadow`,`left`,`bottom`],{duration:e.transitions.duration.shortest}),"@media (forced-colors: active)":{border:`1px solid ButtonBorder`},"&::before":{position:`absolute`,content:`""`,borderRadius:`inherit`,width:`100%`,height:`100%`,boxShadow:(e.vars||e).shadows[2]},"&::after":{position:`absolute`,content:`""`,borderRadius:`50%`,width:42,height:42,top:`50%`,left:`50%`,transform:`translate(-50%, -50%)`},[`&.${X.disabled}`]:{"&:hover":{boxShadow:`none`}},variants:[{props:{size:`small`},style:{width:12,height:12,"&::before":{boxShadow:`none`}}},{props:{orientation:`horizontal`},style:{top:`50%`,transform:`translate(-50%, -50%)`}},{props:{orientation:`vertical`},style:{left:`50%`,transform:`translate(-50%, 50%)`}},...Object.entries(e.palette).filter(t()).map(([t])=>({props:{color:t},style:{[`&:hover, &.${X.focusVisible}`]:{boxShadow:`0px 0px 0px 8px ${e.alpha((e.vars||e).palette[t].main,.16)}`,"@media (hover: none)":{boxShadow:`none`}},[`&.${X.active}`]:{boxShadow:`0px 0px 0px 14px ${e.alpha((e.vars||e).palette[t].main,.16)}`}}}))]}))),$=a(we,{name:`MuiSlider`,slot:`ValueLabel`})(b(({theme:e})=>({zIndex:1,whiteSpace:`nowrap`,...e.typography.body2,fontWeight:500,transition:e.transitions.create([`transform`],{duration:e.transitions.duration.shortest}),position:`absolute`,backgroundColor:(e.vars||e).palette.grey[600],borderRadius:2,color:(e.vars||e).palette.common.white,display:`flex`,alignItems:`center`,justifyContent:`center`,padding:`0.25rem 0.75rem`,variants:[{props:{orientation:`horizontal`},style:{transform:`translateY(-100%) scale(0)`,top:`-10px`,transformOrigin:`bottom center`,"&::before":{position:`absolute`,content:`""`,width:8,height:8,transform:`translate(-50%, 50%) rotate(45deg)`,backgroundColor:`inherit`,bottom:0,left:`50%`},[`&.${X.valueLabelOpen}`]:{transform:`translateY(-100%) scale(1)`}}},{props:{orientation:`vertical`},style:{transform:`translateY(-50%) scale(0)`,right:`30px`,top:`50%`,transformOrigin:`right center`,"&::before":{position:`absolute`,content:`""`,width:8,height:8,transform:`translate(-50%, -50%) rotate(45deg)`,backgroundColor:`inherit`,right:-8,top:`50%`},[`&.${X.valueLabelOpen}`]:{transform:`translateY(-50%) scale(1)`}}},{props:{size:`small`},style:{fontSize:e.typography.pxToRem(12),padding:`0.25rem 0.5rem`}},{props:{orientation:`vertical`,size:`small`},style:{right:`20px`}}]}))),ke=a(`span`,{name:`MuiSlider`,slot:`Mark`,shouldForwardProp:e=>f(e)&&e!==`markActive`,overridesResolver:(e,t)=>{let{markActive:n}=e;return[t.mark,n&&t.markActive]}})(b(({theme:e})=>({position:`absolute`,width:2,height:2,borderRadius:1,backgroundColor:`currentColor`,variants:[{props:{orientation:`horizontal`},style:{top:`50%`,transform:`translate(-1px, -50%)`}},{props:{orientation:`vertical`},style:{left:`50%`,transform:`translate(-50%, 1px)`}},{props:{markActive:!0},style:{backgroundColor:(e.vars||e).palette.background.paper,opacity:.8}}]}))),Ae=a(`span`,{name:`MuiSlider`,slot:`MarkLabel`,shouldForwardProp:e=>f(e)&&e!==`markLabelActive`})(b(({theme:e})=>({...e.typography.body2,color:(e.vars||e).palette.text.secondary,position:`absolute`,whiteSpace:`nowrap`,variants:[{props:{orientation:`horizontal`},style:{top:30,transform:`translateX(-50%)`,"@media (pointer: coarse)":{top:40}}},{props:{orientation:`vertical`},style:{left:36,transform:`translateY(50%)`,"@media (pointer: coarse)":{left:44}}},{props:{markLabelActive:!0},style:{color:(e.vars||e).palette.text.primary}}]}))),je=e=>{let{disabled:t,dragging:n,marked:r,orientation:i,track:a,classes:o,color:s,size:c}=e;return p({root:[`root`,t&&`disabled`,n&&`dragging`,r&&`marked`,i===`vertical`&&`vertical`,a===`inverted`&&`trackInverted`,a===!1&&`trackFalse`,s&&`color${d(s)}`,c&&`size${d(c)}`],rail:[`rail`],track:[`track`],mark:[`mark`],markActive:[`markActive`],markLabel:[`markLabel`],markLabelActive:[`markLabelActive`],valueLabel:[`valueLabel`],thumb:[`thumb`,t&&`disabled`],active:[`active`],disabled:[`disabled`],focusVisible:[`focusVisible`]},Se,o)},Me=({children:e})=>e,Ne=K.forwardRef(function(e,t){let n=l({props:e,name:`MuiSlider`}),r=te(),{"aria-label":i,"aria-valuetext":a,"aria-labelledby":o,color:s=`primary`,classes:c,className:u,disableSwap:d=!1,disabled:f=!1,getAriaLabel:p,getAriaValueText:m,marks:h=!1,max:g=100,min:v=0,name:ee,onChange:y,onChangeCommitted:b,orientation:x=`horizontal`,shiftStep:S=10,size:re=`medium`,step:ie=1,scale:w=Te,slotProps:T={},slots:E={},tabIndex:ae,track:D=`normal`,value:O,valueLabelDisplay:k=`off`,valueLabelFormat:A=Te,...j}=n,M={...n,isRtl:r,max:g,min:v,classes:c,disabled:f,disableSwap:d,orientation:x,marks:h,color:s,size:re,step:ie,shiftStep:S,scale:w,track:D,valueLabelDisplay:k,valueLabelFormat:A},{axisProps:N,getRootProps:P,getHiddenInputProps:F,getThumbProps:oe,open:I,active:L,axis:R,focusedThumbIndex:z,range:B,dragging:V,marks:H,values:U,trackOffset:W,trackLeap:se,getThumbStyle:G}=xe({...M,rootRef:t});M.marked=H.length>0&&H.some(e=>e.label),M.dragging=V,M.focusedThumbIndex=z;let q=je(M),J={slots:E,slotProps:T},[ce,Y]=C(`root`,{elementType:Ee,getSlotProps:P,externalForwardedProps:{...J,...j},ownerState:M,className:[q.root,u]}),[le,ue]=C(`rail`,{elementType:De,externalForwardedProps:J,ownerState:M,className:q.rail}),[de,pe]=C(`track`,{elementType:Q,externalForwardedProps:J,additionalProps:{style:{...N[R].offset(W),...N[R].leap(se)}},ownerState:M,className:q.track}),[me,he]=C(`thumb`,{elementType:Oe,getSlotProps:oe,externalForwardedProps:J,ownerState:M,className:q.thumb}),[ge,_e]=C(`valueLabel`,{elementType:$,externalForwardedProps:J,ownerState:M,className:q.valueLabel}),[ve,ye]=C(`mark`,{elementType:ke,externalForwardedProps:J,ownerState:M,className:q.mark}),[be,Se]=C(`markLabel`,{elementType:Ae,externalForwardedProps:J,ownerState:M,className:q.markLabel}),[X,Ce]=C(`input`,{elementType:`input`,getSlotProps:F,externalForwardedProps:J,ownerState:M});return(0,Z.jsxs)(ce,{...Y,children:[(0,Z.jsx)(le,{...ue}),(0,Z.jsx)(de,{...pe}),H.filter(e=>e.value>=v&&e.value<=g).map((e,t)=>{let n=fe(e.value,v,g),r=N[R].offset(n),i;return i=D===!1?U.includes(e.value):D===`normal`&&(B?e.value>=U[0]&&e.value<=U[U.length-1]:e.value<=U[0])||D===`inverted`&&(B?e.value<=U[0]||e.value>=U[U.length-1]:e.value>=U[0]),(0,Z.jsxs)(K.Fragment,{children:[(0,Z.jsx)(ve,{"data-index":t,...ye,...!ne(ve)&&{markActive:i},style:{...r,...ye.style},className:_(ye.className,i&&q.markActive)}),e.label==null?null:(0,Z.jsx)(be,{"aria-hidden":!0,"data-index":t,...Se,...!ne(be)&&{markLabelActive:i},style:{...r,...Se.style},className:_(q.markLabel,Se.className,i&&q.markLabelActive),children:e.label})]},t)}),U.map((e,t)=>{let n=fe(e,v,g),r=N[R].offset(n),s=k===`off`?Me:ge;return(0,Z.jsx)(s,{...!ne(s)&&{valueLabelFormat:A,valueLabelDisplay:k,value:typeof A==`function`?A(w(e),t):A,index:t,open:I===t||L===t||k===`on`,disabled:f},..._e,children:(0,Z.jsx)(me,{"data-index":t,...he,className:_(q.thumb,he.className,L===t&&q.active,z===t&&q.focusVisible),style:{...r,...G(t),...he.style},children:(0,Z.jsx)(X,{"data-index":t,"aria-label":p?p(t):i,"aria-valuenow":w(e),"aria-labelledby":o,"aria-valuetext":m?m(w(e),t):a,value:U[t],...Ce})})},t)})]})}),Pe=o((0,Z.jsx)(`path`,{d:`M5 20h14v-2H5zM19 9h-4V3H9v6H5l7 7z`}),`Download`),Fe=o((0,Z.jsx)(`path`,{d:`M6 19h4V5H6zm8-14v14h4V5z`}),`Pause`),Ie=o((0,Z.jsx)(`path`,{d:`m4 18 8.5-6L4 6zm9-12v12l8.5-6z`}),`FastForward`),Le=o((0,Z.jsx)(`path`,{d:`M11 18V6l-8.5 6zm.5-6 8.5 6V6z`}),`FastRewind`),Re=v()(e=>({root:{height:`100%`},sidebar:{display:`flex`,flexDirection:`column`,position:`fixed`,zIndex:3,left:0,top:0,margin:e.spacing(1.5),width:e.dimensions.drawerWidthDesktop,[e.breakpoints.down(`md`)]:{width:`100%`,margin:0}},title:{flexGrow:1},slider:{width:`100%`},controls:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},formControlLabel:{height:`100%`,width:`100%`,paddingRight:e.spacing(1),justifyContent:`space-between`,alignItems:`center`},content:{display:`flex`,flexDirection:`column`,padding:e.spacing(2),[e.breakpoints.down(`md`)]:{margin:e.spacing(1)},[e.breakpoints.up(`md`)]:{marginTop:e.spacing(1)}}}));

const BatteryIcon = o((0, Z.jsx)("path", { d: "M17 5H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 12H3V7h14v10m2-2h2V9h-2v6z" }), "Battery");

const PegmanIcon = o((0, Z.jsx)("path", { d: "M12,2A3,3 0 0,0 9,5A3,3 0 0,0 12,8A3,3 0 0,0 15,5A3,3 0 0,0 12,2M12,9C9.75,9 6.8,10.09 5.86,11.23C5.3,11.9 5,12.56 5,13.25V22H19V13.25C19,12.56 18.7,11.9 18.14,11.23C17.2,10.09 14.25,9 12,9M12,11C14,11 15.8,11.75 16.36,12.44C16.74,12.91 17,13.33 17,13.75V20H15V15H13V20H11V15H9V20H7V13.75C7,13.33 7.26,12.91 7.64,12.44C8.2,11.75 10,11 12,11Z" }), "Pegman");

const DropdownField = ({ label, value, isActive }) => {
  return (0, Z.jsxs)("div", {
    style: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      minWidth: "160px",
      height: "38px",
      border: isActive ? "1px solid #1976d2" : "1px solid #94a3b8",
      borderRadius: "4px",
      padding: "0 12px",
      backgroundColor: "#fff",
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      boxSizing: "border-box",
      cursor: "pointer",
      flex: "1 1 auto"
    },
    children: [
      (0, Z.jsx)("span", {
        style: {
          position: "absolute",
          left: "8px",
          top: "-9px",
          backgroundColor: "#fff",
          padding: "0 4px",
          fontSize: "0.75rem",
          color: isActive ? "#1976d2" : "#475569",
          fontWeight: isActive ? "600" : "500",
          pointerEvents: "none"
        },
        children: label
      }),
      (0, Z.jsx)("span", {
        style: {
          fontSize: "0.85rem",
          color: "#0f172a",
          fontWeight: "500",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
          paddingRight: "16px"
        },
        children: value
      }),
      (0, Z.jsx)("svg", {
        viewBox: "0 0 24 24",
        style: {
          position: "absolute",
          right: "8px",
          width: "20px",
          height: "20px",
          fill: isActive ? "#1976d2" : "#475569",
          pointerEvents: "none"
        },
        children: (0, Z.jsx)("path", { d: "M7 10l5 5 5-5z" })
      })
    ]
  });
};

const MostrarButton = () => {
  return (0, Z.jsxs)("div", {
    style: {
      display: "inline-flex",
      alignItems: "stretch",
      height: "38px",
      border: "1px solid #2e7d32",
      borderRadius: "4px",
      backgroundColor: "#fff",
      boxSizing: "border-box",
      cursor: "pointer",
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    children: [
      (0, Z.jsx)("div", {
        style: {
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          color: "#2e7d32",
          fontWeight: "600",
          fontSize: "0.875rem",
          letterSpacing: "0.02857em",
          textTransform: "uppercase"
        },
        children: "MOSTRAR"
      }),
      (0, Z.jsx)("div", {
        style: {
          width: "1px",
          backgroundColor: "#2e7d32",
          margin: "8px 0"
        }
      }),
      (0, Z.jsx)("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 8px"
        },
        children: (0, Z.jsx)("svg", {
          viewBox: "0 0 24 24",
          style: {
            width: "20px",
            height: "20px",
            fill: "#2e7d32"
          },
          children: (0, Z.jsx)("path", { d: "M7 10l5 5 5-5z" })
        })
      })
    ]
  });
};

const BatteryChartPopup = ({ positions, currentIndex, open, onClose, collaboratorName }) => {
  const theme = useThemeHook();
  const tTheme = theme || {};

  const data = K.useMemo(() => {
    if (!positions || positions.length === 0) return [];
    const rawData = positions.map((pos, idx) => {
      const val = pos.attributes.batteryLevel ?? pos.attributes.battery ?? null;
      return {
        originalIndex: idx,
        fixTime: new Date(pos.fixTime).getTime(),
        batteryLevel: val
      };
    });

    const maxPoints = 800;
    if (rawData.length > maxPoints) {
      const step = Math.ceil(rawData.length / maxPoints);
      const sampled = [];
      for (let i = 0; i < rawData.length; i += step) {
        sampled.push(rawData[i]);
      }
      if (sampled[sampled.length - 1].originalIndex !== rawData[rawData.length - 1].originalIndex) {
        sampled.push(rawData[rawData.length - 1]);
      }
      return sampled;
    }
    return rawData;
  }, [positions]);

  const closestDataIndex = K.useMemo(() => {
    if (!data || data.length === 0) return -1;
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const diff = Math.abs(data[i].originalIndex - currentIndex);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    return closestIdx;
  }, [data, currentIndex]);

  if (!open || !positions || positions.length === 0) return null;

  const width = "100%";
  const height = 350;
  const margin = { top: 10, right: 20, left: -10, bottom: 5 };

  const currentPos = positions[currentIndex];
  const currentBat = currentPos ? (currentPos.attributes.batteryLevel ?? currentPos.attributes.battery ?? null) : null;

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isRtl = tTheme.direction === "rtl";
  const yAxisWidth = 40;

  const popupBg = "#ffffff";
  const popupText = "#0f172a"; 
  const popupTextSecondary = "#475569"; 
  const popupBorder = "#cbd5e1"; 
  const popupDivider = "#e2e8f0"; 
  const lineStroke = "#1976d2"; 
  const gridStroke = "#e2e8f0"; 
  const playheadStroke = "#d32f2f"; 
  const playheadFill = "#d32f2f";

  const animationStyle = `
    @keyframes popup-fade-in {
      0% { opacity: 0; transform: translate(-50%, -47%) scale(0.96); }
      100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes backdrop-fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
  `;

  return (0, Z.jsxs)(Z.Fragment, {
    children: [
      (0, Z.jsx)("style", { children: animationStyle }),
      (0, Z.jsx)("div", {
        onClick: onClose,
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.4)", 
          backdropFilter: "blur(4px)",
          webkitBackdropFilter: "blur(4px)",
          zIndex: 999,
          animation: "backdrop-fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }
      }),
      (0, Z.jsxs)("div", {
        style: {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(650px, 95vw)",
          height: "min(430px, 80vh)",
          minWidth: "min(460px, 90vw)",
          maxWidth: "min(680px, 95vw)",
          minHeight: "min(400px, 75vh)",
          maxHeight: "min(580px, 85vh)",
          resize: "both",
          overflow: "hidden",
          background: popupBg,
          border: `1px solid ${popupBorder}`,
          borderRadius: "8px",
          padding: "16px",
          zIndex: 1000,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)",
          color: popupText,
          fontFamily: "Inter, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          animation: "popup-fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
        },
        children: [

          (0, Z.jsxs)("div", {
            style: {
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: "8px",
              marginBottom: "8px"
            },
            children: [
              (0, Z.jsx)(DropdownField, { label: "Colaboradores", value: collaboratorName || "Colaborador Simulado" }),
              (0, Z.jsx)(DropdownField, { label: "Período", value: "Semana Anterior" }),
              (0, Z.jsx)(DropdownField, { label: "Tipo de gráfica", value: "Nivel de batería", isActive: true }),
              (0, Z.jsx)(DropdownField, { label: "Hora", value: "Hora ajustada" }),
              (0, Z.jsx)(MostrarButton, {})
            ]
          }),
          (0, Z.jsx)("div", {
            style: { flexGrow: 1, marginTop: "12px", width: "100%", minHeight: "0" },
            children: (0, Z.jsx)(ResponsiveContainer, {
              width: "100%",
              height: "100%",
              debounce: 100,
              children: (0, Z.jsxs)(LineChart, {
                data: data,
                margin: margin,
                children: [
                  (0, Z.jsx)(XAxis, {
                    stroke: popupTextSecondary,
                    dataKey: "fixTime",
                    type: "number",
                    tickFormatter: (e) => k(e, "time"),
                    domain: ["dataMin", "dataMax"],
                    scale: "time",
                    style: { fontSize: "10px" }
                  }),
                  (0, Z.jsx)(YAxis, {
                    stroke: popupTextSecondary,
                    type: "number",
                    domain: [0, 100],
                    width: yAxisWidth,
                    tickFormatter: (e) => `${e}%`,
                    style: { fontSize: "10px" }
                  }),
                  (0, Z.jsx)(CartesianGrid, {
                    stroke: gridStroke,
                    strokeDasharray: "3 3"
                  }),
                  (0, Z.jsx)(Tooltip, {
                    isAnimationActive: false,
                    contentStyle: {
                      backgroundColor: "#ffffff",
                      color: "#1e293b",
                      border: `1px solid ${popupBorder}`,
                      borderRadius: "8px",
                      fontSize: "12px"
                    },
                    formatter: (e) => [e, "Batería"],
                    labelFormatter: (e) => k(e, "seconds")
                  }),
                  (0, Z.jsx)(Line, {
                    type: "monotone",
                    dataKey: "batteryLevel",
                    stroke: lineStroke,
                    strokeWidth: 2,
                    isAnimationActive: false,
                    dot: (props) => {
                      const { cx, cy, index } = props;
                      if (index === closestDataIndex) {
                        return (0, Z.jsxs)("g", {
                          children: [
                            (0, Z.jsx)("line", {
                              x1: cx,
                              y1: 10,
                              x2: cx,
                              y2: 310,
                              stroke: playheadStroke,
                              strokeWidth: 1.5,
                              strokeDasharray: "3 3"
                            }),
                            (0, Z.jsx)("circle", {
                              cx: cx,
                              cy: cy,
                              r: 6,
                              fill: playheadFill,
                              stroke: "#fff",
                              strokeWidth: 1.5
                            })
                          ]
                        });
                      }
                      return null;
                    },
                    activeDot: { r: 5 },
                    connectNulls: true
                  }),
                  (0, Z.jsx)(Brush, {
                    dataKey: "fixTime",
                    height: 25,
                    stroke: lineStroke,
                    fill: "rgba(63, 81, 181, 0.05)",
                    tickFormatter: (e) => k(e, "time"),
                    startIndex: 0,
                    endIndex: data.length - 1
                  })
                ]
              })
            })
          })
        ]
      })
    ]
  });
}

var ze=()=>{let e=M(),{classes:t}=Re(),r=T(),i=(0,K.useRef)(),[a]=w(),o=c(e=>e.devices.selectedId),[s,l]=(0,K.useState)([]),[u,d]=(0,K.useState)(0),[f,p]=(0,K.useState)(o),[m,h]=(0,K.useState)(!1),g=a.get(`from`),_=a.get(`to`),[v,ee]=(0,K.useState)(!1),[y,b]=(0,K.useState)(!1),[x,te]=(0,K.useState)(!1),S=!!(g&&_&&!y&&s.length),ne=c(e=>{if(f){let t=e.devices.items[f];if(t)return t.name}return null});const[playbackSpeed,setPlaybackSpeed]=(0,K.useState)(1);
const[showBatteryChart,setShowBatteryChart]=(0,K.useState)(false);
const batteryControl = (0, K.useMemo)(() => {
  const container = document.createElement('div');
  container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
  container.style.margin = '10px 10px 0 0';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'maplibregl-ctrl-icon';
  button.style.width = '29px';
  button.style.height = '29px';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.cursor = 'pointer';
  button.style.background = 'transparent';
  button.style.border = 'none';
  button.style.padding = '0';
  button.style.color = '#333';
  button.style.transition = 'background-color 0.2s ease, transform 0.1s ease';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="transition: filter 0.2s ease;">
      <path d="M17 5H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 12H3V7h14v10m2-2h2V9h-2v6z"></path>
    </svg>
  `;
  button.onclick = () => {
    setShowBatteryChart(prev => !prev);
  };
  container.appendChild(button);
  return {
    onAdd: () => container,
    onRemove: () => {
      container.remove();
    },
    button
  };
}, []);
(0, K.useEffect)(() => {
  if (!mapInstance) return;
  const timer = setTimeout(() => {
    try {
      mapInstance.addControl(batteryControl, 'top-right');
    } catch (err) {
      console.error('Error adding battery control:', err);
    }
  }, 100);
  return () => {
    clearTimeout(timer);
    try {
      mapInstance.removeControl(batteryControl);
    } catch (err) {}
  };
}, [mapInstance, batteryControl]);
(0, K.useEffect)(() => {
  if (batteryControl.button) {
    const svg = batteryControl.button.querySelector('svg');
    if (showBatteryChart) {
      batteryControl.button.style.setProperty('background-color', '#eb0045', 'important');
      batteryControl.button.style.setProperty('color', '#fff', 'important');
      if (svg) svg.style.setProperty('filter', 'invert(1) brightness(10)', 'important');
    } else {
      batteryControl.button.style.backgroundColor = 'transparent';
      batteryControl.button.style.color = '#333';
      if (svg) svg.style.filter = 'none';
    }
  }
}, [showBatteryChart, batteryControl]);
const[showStreetView,setShowStreetView]=(0,K.useState)(false);const[streetViewPos,setStreetViewPos]=(0,K.useState)(null);const theme = useThemeHook();const googleKey = c(state => state.session.server.attributes.googleMapsKey || state.session.server.attributes.googleKey);
const[panelSize,setPanelSize]=(0,K.useState)({width:360,height:320});const[isResizing,setIsResizing]=(0,K.useState)(false);const[streetViewAvailable,setStreetViewAvailable]=(0,K.useState)(true);const resizeStartRef=(0,K.useRef)({clientX:0,clientY:0,width:360,height:320});
const handleResizePointerDown=(e)=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  e.currentTarget.setPointerCapture(e.pointerId);
  resizeStartRef.current={
    clientX: e.clientX,
    clientY: e.clientY,
    width: panelSize.width,
    height: panelSize.height
  };
  setIsResizing(true);
};
const handleResizePointerMove=(e)=>{
  if(!isResizing)return;
  const dx=e.clientX-resizeStartRef.current.clientX;
  const dy=e.clientY-resizeStartRef.current.clientY;
  let w=resizeStartRef.current.width-dx;
  let h=resizeStartRef.current.height-dy;
  w=Math.max(280,Math.min(600,w));
  h=Math.max(240,Math.min(500,h));
  setPanelSize({width:w,height:h});
};
const handleResizePointerUp=(e)=>{
  if(!isResizing)return;
  setIsResizing(false);
  try{e.currentTarget.releasePointerCapture(e.pointerId)}catch(err){}
};
const[isDraggingPegman,setIsDraggingPegman]=(0,K.useState)(false);
const[pegmanDragPos,setPegmanDragPos]=(0,K.useState)({x:0,y:0});
const dragStartRef=(0,K.useRef)({x:0,y:0});
const handlePegmanPointerDown=(e)=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  e.currentTarget.setPointerCapture(e.pointerId);
  dragStartRef.current={x:e.clientX,y:e.clientY};
  setPegmanDragPos({x:e.clientX,y:e.clientY});
  setIsDraggingPegman(true);
};
const handlePegmanPointerMove=(e)=>{
  if(!isDraggingPegman)return;
  setPegmanDragPos({x:e.clientX,y:e.clientY});
};
const handlePegmanPointerUp=(e)=>{
  if(!isDraggingPegman)return;
  setIsDraggingPegman(false);
  try{e.currentTarget.releasePointerCapture(e.pointerId)}catch(err){}
  const dx=e.clientX-dragStartRef.current.x;
  const dy=e.clientY-dragStartRef.current.y;
  const dist=Math.sqrt(dx*dx+dy*dy);
  if(dist<8){
    setShowStreetView(prev=>!prev);
  }else if(mapInstance){
    const mapCanvas=mapInstance.getCanvas();
    if(mapCanvas){
      const rect=mapCanvas.getBoundingClientRect();
      const x=e.clientX-rect.left;
      const y=e.clientY-rect.top;
      if(x>=0&&x<=rect.width&&y>=0&&y<=rect.height){
        const lngLat=mapInstance.unproject([x,y]);
        setStreetViewPos({latitude:lngLat.lat,longitude:lngLat.lng,course:0});
        setShowStreetView(true);
      }
    }
  }
};
(0,K.useEffect)(()=>{!g&&!_&&l([])},[g,_,l]);(0,K.useEffect)(()=>{if(!s||s.length===0||u>=s.length){setStreetViewPos(null);return;}const currentPos=s[u];if(!v){setStreetViewPos(currentPos);}else{const handler=setTimeout(()=>{setStreetViewPos(currentPos);},1500);return()=>clearTimeout(handler);}},[u,v,s]);(0,K.useEffect)(()=>{if(!v||!s.length)return;const intervalTime=Math.max(30,500/playbackSpeed);const intervalId=setInterval(()=>{d(e=>{const t=e+1;if(t>=s.length){ee(!1);return e;}return t;});},intervalTime);return()=>clearInterval(intervalId);},[v,s,playbackSpeed]);let re=(0,K.useCallback)((e,t)=>{d(t)},[d]),C=(0,K.useCallback)(e=>{h(!!e)},[h]),ie=A(async({deviceIds:t,from:n,to:r})=>{let i=t.find(()=>!0);b(!0),p(i);let a=new URLSearchParams({deviceId:i,from:n,to:r});try{let t=await P(`/api/positions?${a.toString()}`);d(0);let n=await t.json();if(l(n),!n.length)throw Error(e(`sharedNoData`));te(!1)}finally{b(!1)}},[e]);(0,K.useEffect)(()=>{if(!googleKey||!streetViewPos){setStreetViewAvailable(false);return;}let active=true;const url=`https://maps.googleapis.com/maps/api/streetview/metadata?location=${streetViewPos.latitude},${streetViewPos.longitude}&key=${googleKey}`;fetch(url).then(res=>res.json()).then(data=>{if(active){if(data.status==="ZERO_RESULTS"||data.status==="NOT_FOUND"){setStreetViewAvailable(false)}else{setStreetViewAvailable(true)}}}).catch(()=>{if(active){setStreetViewAvailable(true)}});return()=>{active=false}},[streetViewPos,googleKey]);const streetViewStyle = `
  .streetview-btn-container {
    position: fixed;
    bottom: 40px;
    right: 10px;
    z-index: 1000;
  }
  .streetview-panel-container {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px;
    z-index: 1000;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: Inter, sans-serif;
    overflow: hidden;
  }
`;
const streetViewUrl = googleKey && streetViewPos
  ? `https://www.google.com/maps/embed/v1/streetview?key=${googleKey}&location=${streetViewPos.latitude},${streetViewPos.longitude}&heading=${streetViewPos.course || 0}&pitch=0&fov=90`
  : null;
const externalUrl = streetViewPos
  ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${streetViewPos.latitude},${streetViewPos.longitude}`
  : "";
return(0,Z.jsxs)(`div`,{className:t.root,children:[(0,Z.jsxs)(I,{children:[(0,Z.jsx)(z,{}),(0,Z.jsx)(L,{}),(0,Z.jsx)(U,{positions:s}),(0,Z.jsx)(W,{positions:s,onClick:re,showSpeedControl:!0}),u<s.length&&(0,Z.jsx)(R,{positions:[s[u]],onMarkerClick:C,titleField:`fixTime`}),(0,Z.jsx)(MapGeocoder,{})]}),(0,Z.jsx)(B,{}),(0,Z.jsx)(V,{positions:s}),(0,Z.jsxs)(`div`,{className:t.sidebar,children:[(0,Z.jsx)(n,{elevation:3,square:!0,children:(0,Z.jsxs)(F,{children:[(0,Z.jsx)(E,{edge:`start`,sx:{mr:2},onClick:()=>r(-1),children:(0,Z.jsx)(oe,{})}),(0,Z.jsx)(D,{variant:`h6`,className:t.title,children:e(`reportReplay`)}),S&&(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(E,{onClick:()=>{let e=new URLSearchParams({deviceId:f,from:g,to:_});window.location.assign(`/api/positions/kml?${e.toString()}`)},children:(0,Z.jsx)(Pe,{})}),(0,Z.jsx)(E,{edge:`end`,onClick:()=>te(e=>!e),children:(0,Z.jsx)(N,{})})]})]})}),(0,Z.jsxs)(n,{className:t.content,square:!0,children:[S&&!x&&(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(D,{variant:`subtitle1`,align:`center`,children:ne}),(0,Z.jsx)(Ne,{className:t.slider,max:s.length-1,step:1,marks:!1,value:u,onChange:(e,t)=>d(t)}),(0,Z.jsxs)(`div`,{className:t.controls,children:[(0,Z.jsx)(D,{variant:`caption`,children:`${u+1}/${s.length}`}),(0,Z.jsx)(E,{onClick:()=>d(e=>e-1),disabled:v||u<=0,children:(0,Z.jsx)(Le,{})}),(0,Z.jsx)(E,{onClick:()=>ee(!v),disabled:u>=s.length-1,children:v?(0,Z.jsx)(Fe,{}):(0,Z.jsx)(H,{})}),(0,Z.jsx)(E,{onClick:()=>d(e=>e+1),disabled:v||u>=s.length-1,children:(0,Z.jsx)(Ie,{})}),(0,Z.jsx)(`button`,{onClick:()=>setPlaybackSpeed(e=>{if(e===1)return 2;if(e===2)return 4;if(e===4)return 8;if(e===8)return 16;return 1;}),onMouseEnter:(e)=>{e.currentTarget.style.background="rgba(235,0,69,0.15)";e.currentTarget.style.color="#eb0045";e.currentTarget.style.borderColor="rgba(235,0,69,0.4)";e.currentTarget.style.transform="scale(1.05)";},onMouseLeave:(e)=>{e.currentTarget.style.background="rgba(235,0,69,0.05)";e.currentTarget.style.color="inherit";e.currentTarget.style.borderColor="rgba(235,0,69,0.2)";e.currentTarget.style.transform="scale(1)";},style:{background:"rgba(235,0,69,0.05)",border:"1px solid rgba(235,0,69,0.2)",borderRadius:"16px",color:`inherit`,cursor:`pointer`,fontSize:`0.75rem`,fontWeight:`700`,padding:`4px 10px`,marginLeft:`4px`,marginRight:`4px`,transition:`all 0.2s ease`,display:`inline-flex`,alignItems:`center`,justifyContent:`center`,outline:`none`},children:(0,Z.jsxs)(`span`,{style:{display:`inline-flex`,alignItems:`center`},children:[(0,Z.jsx)(`svg`,{width:`12`,height:`12`,viewBox:`0 0 24 24`,fill:`currentColor`,style:{marginRight:`4px`},children:(0,Z.jsx)(`path`,{d:`M13 2L3 14h9l-1 8 10-12h-9l1-8z`})}),`${playbackSpeed}x`]})}),(0,Z.jsx)(D,{variant:`caption`,children:s[u]&&s[u].fixTime?k(s[u].fixTime,`seconds`):""})]})]}),(0,Z.jsx)(`div`,{style:{display:S&&!x?`none`:`block`},children:(0,Z.jsx)(O,{onShow:ie,deviceType:`single`,loading:y})})]})]}),m&&u>=0&&u<s.length&&s[u]&&(0,Z.jsx)(j,{deviceId:f,position:s[u],onClose:()=>h(!1),disableActions:!0}),(0,Z.jsx)(BatteryChartPopup,{positions:s,currentIndex:u,open:showBatteryChart,onClose:()=>setShowBatteryChart(false),collaboratorName:ne}),S&&!x&&streetViewPos&&(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)("style",{children:streetViewStyle}),showStreetView&&(0,Z.jsxs)("div",{className:"streetview-panel-container",style:{width:`${panelSize.width}px`,height:`${panelSize.height}px`,position:"fixed",bottom:"80px",right:"16px"},children:[(0,Z.jsx)("div",{onPointerDown:handleResizePointerDown,onPointerMove:handleResizePointerMove,onPointerUp:handleResizePointerUp,style:{position:"absolute",top:0,left:0,width:"20px",height:"20px",cursor:"nwse-resize",zIndex:1001,touchAction:"none"},children:(0,Z.jsx)("svg",{width:"12",height:"12",viewBox:"0 0 12 12",style:{position:"absolute",top:"3px",left:"3px",fill:"none",stroke:"#cbd5e1",strokeWidth:1.5,strokeLinecap:"round"},children:(0,Z.jsxs)("g",{children:[(0,Z.jsx)("line",{x1:"1",y1:"1",x2:"9",y2:"9"}),(0,Z.jsx)("line",{x1:"1",y1:"5",x2:"5",y2:"9"}),(0,Z.jsx)("line",{x1:"5",y1:"1",x2:"9",y2:"5"})]})})}),(0,Z.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #e2e8f0",paddingBottom:"4px",paddingLeft:"16px"},children:[(0,Z.jsxs)("span",{style:{fontWeight:"600",fontSize:"0.85rem",color:"#0f172a"},children:["Street View: ",ne||"Colaborador"]}),(0,Z.jsx)("button",{onClick:()=>setShowStreetView(!1),style:{background:"transparent",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:"1rem",padding:"2px 6px"},children:"✕"})]}),streetViewUrl?(streetViewAvailable?(0,Z.jsx)("iframe",{src:streetViewUrl,style:{width:"100%",flexGrow:1,border:"none",borderRadius:"4px",background:"#000"},allowFullScreen:!0,loading:"lazy"}):(0,Z.jsxs)("div",{style:{flexGrow:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",fontSize:"0.75rem",color:"#64748b",padding:"16px",background:"#f8fafc",borderRadius:"4px",gap:"8px"},children:[(0,Z.jsxs)("svg",{width:"40",height:"40",viewBox:"0 0 24 24",fill:"none",stroke:"#94a3b8",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",children:[(0,Z.jsx)("path",{d:"M9.43 9.43a3 3 0 0 0 4.14 4.14"}),(0,Z.jsx)("path",{d:"M19 12c0-3.37-2.31-7.1-5-10a18.9 18.9 0 0 0-4-3.66"}),(0,Z.jsx)("path",{d:"M12 22s-8-10-8-14a8 8 0 0 1 1.7-4.9"}),(0,Z.jsx)("line",{x1:1,y1:1,x2:23,y2:23})]}),(0,Z.jsx)("span",{children:"Sin cobertura de Street View en esta ubicación"})]})):(0,Z.jsx)("div",{style:{flexGrow:1,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",fontSize:"0.75rem",color:"#64748b",padding:"16px",background:"#f8fafc",borderRadius:"4px"},children:"API Key de Google Maps no configurada. Por favor añádela en Atributos del Servidor."}),(0,Z.jsx)("a",{href:externalUrl,target:"_blank",rel:"noopener noreferrer",style:{display:"block",textAlign:"center",background:"#eb0045",color:"#fff",borderRadius:"12px",padding:"10px 16px",fontSize:"0.75rem",fontWeight:"600",textDecoration:"none",transition:"background 0.2s, transform 0.1s"},onMouseEnter:e=>{e.currentTarget.style.background="#c3003a"},onMouseLeave:e=>{e.currentTarget.style.background="#eb0045"},onMouseDown:e=>{e.currentTarget.style.transform="scale(0.98)"},onMouseUp:e=>{e.currentTarget.style.transform="scale(1)"},children:"Ver en Google Maps"})]}),(0,Z.jsx)("div",{className:"streetview-btn-container maplibregl-ctrl maplibregl-ctrl-group",style:{margin:0,background:showStreetView?"#eb0045":"rgba(255, 255, 255, 0.7)"},children:(0,Z.jsx)("button",{type:"button",onPointerDown:handlePegmanPointerDown,onPointerMove:handlePegmanPointerMove,onPointerUp:handlePegmanPointerUp,style:{width:"29px",height:"29px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",touchAction:"none",padding:0},children:(0,Z.jsx)(PegmanIcon,{style:{fontSize:"20px",color:showStreetView?"#fff":"#333"}})})}),isDraggingPegman&&(0,Z.jsx)("div",{style:{position:"fixed",left:`${pegmanDragPos.x-15}px`,top:`${pegmanDragPos.y-15}px`,width:"29px",height:"29px",borderRadius:"12px",background:"#eb0045",border:"1px solid #fff",boxShadow:"0 4px 10px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:9999},children:(0,Z.jsx)(PegmanIcon,{style:{fontSize:"20px",color:"#fff"}})})]})]})};export{ze as default};