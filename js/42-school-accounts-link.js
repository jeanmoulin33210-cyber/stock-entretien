(function(){
 'use strict';
 if(window.__JURY_DEMO_ACTIVE)return;
 function mount(){
  const hero=document.querySelector('#homeView .hero');
  if(!hero||document.getElementById('schoolAccountsLinkV452'))return;
  const a=document.createElement('a');a.id='schoolAccountsLinkV452';
  a.href='school-accounts.html';a.className='btn btn-secondary';
  a.textContent='Comptes des établissements — essai';
  a.style.cssText='display:inline-block;margin-top:14px;text-decoration:none';
  hero.appendChild(a);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
