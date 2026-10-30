/* Presentation gate only. Server memberships/RLS continue to authorize data.
 * Runs before application code so an unsigned-in owner never sees the home. */
(function(root){
 'use strict';
 function needsLogin(search,isolated){
  if(isolated)return false;
  const q=new URLSearchParams(search||'');
  return !/^[1-9][0-9]*$/.test(q.get('tester')||'');
 }
 const API={needsLogin,locked:false};
 if(typeof module==='object'&&module.exports){module.exports=API;return;}
 const html=document.documentElement;
 root.JuryLoginGateV457=API;
 API.lock=function(){API.locked=true;html.classList.add('login-required-v457');html.classList.remove('login-form-ready-v457');};
 API.formReady=function(){html.classList.add('login-form-ready-v457');};
 API.release=function(){API.locked=false;html.classList.remove('login-required-v457','login-form-ready-v457');};
 if(needsLogin(location.search,!!root.__JURY_DEMO_ACTIVE))API.lock();else API.release();
})(typeof window==='undefined'?globalThis:window);
