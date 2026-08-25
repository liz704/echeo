"use client";

import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function ResetPasswordPage(){
  const [token,setToken]=useState("");
  useEffect(()=>{setToken(new URLSearchParams(window.location.search).get("token")||"")},[]);
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setError(""); setMessage("");
    if(!token){setError("Le lien de récupération est invalide.");return;}
    if(password.length<6){setError("Le mot de passe doit contenir au moins 6 caractères.");return;}
    if(password!==confirm){setError("Les mots de passe ne correspondent pas.");return;}
    setLoading(true);
    try{
      let res:Response;
      try{
        res=await fetch(`${API}/users/reset-password`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password})});
      }catch{
        throw new Error("Le serveur Échéo est actuellement injoignable. Vérifiez qu'il est bien démarré, puis réessayez.");
      }
      const text=await res.text();
      if(!res.ok) throw new Error(text||"Impossible de réinitialiser le mot de passe.");
      setMessage(text); setPassword(""); setConfirm("");
    }catch(err:any){setError(err.message||"Une erreur est survenue.");}
    finally{setLoading(false);}
  };

  return <main className="authPage"><section className="authCard resetCard"><div className="authForm">
    <div className="brand"><div className="brandMark">É</div><div><b>Échéo</b><small>N’oubliez plus ce qui compte.</small></div></div>
    <span className="eyebrow">Sécurité</span><h2>Nouveau mot de passe</h2><p>Choisissez un nouveau mot de passe pour votre compte.</p>
    {error&&<div className="formError">{error}</div>}{message&&<div className="formSuccess">{message}<div style={{marginTop:12}}><a href="/" className="textLink">Retour à la connexion</a></div></div>}
    {!message&&<form onSubmit={submit} className="formGrid"><div><label className="label">Nouveau mot de passe</label><input className="input" type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/></div><div><label className="label">Confirmer le mot de passe</label><input className="input" type="password" minLength={6} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div><button className="btn btn-primary" disabled={loading}>{loading?"…":"Réinitialiser le mot de passe"}</button></form>}
  </div></section></main>;
}
