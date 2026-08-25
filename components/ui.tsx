"use client";
import type { ReactNode } from "react";
import { copy } from "@/lib/translations";

export function Icon({name,size=20}:{name:string;size?:number}){
 const p:any={
  search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  home:<><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></>,
  clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  users:<><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M19 8a3.5 3.5 0 0 1 0 6.8"/></>,
  history:<><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></>,
  mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  chart:<><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1-1.7 1.7-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.7V20h-2.4v-.1a1.8 1.8 0 0 0-1-1.7 1.8 1.8 0 0 0-2 .3l-.1.1-1.7-1.7.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.7-1H6v-2.4h.1a1.8 1.8 0 0 0 1.7-1 1.8 1.8 0 0 0-.3-2l-.1-.1 1.7-1.7.1.1a1.8 1.8 0 0 0 2 .3 1.8 1.8 0 0 0 1-1.7V4h2.4v.1a1.8 1.8 0 0 0 1 1.7 1.8 1.8 0 0 0 2-.3l.1-.1 1.7 1.7-.1.1a1.8 1.8 0 0 0-.3 2 1.8 1.8 0 0 0 1.7 1h.1v2.4h-.1a1.8 1.8 0 0 0-1.7 1Z"/></>,
  help:<><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.8 2c-1.2.8-1.6 1.2-1.6 2.5"/><path d="M12 17h.01"/></>,
  info:<><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/></>,
  x:<><path d="m6 6 12 12M18 6 6 18"/></>,
  plus:<><path d="M12 5v14M5 12h14"/></>,
  trash:<><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 14h10l1-14M9 7V4h6v3"/></>,
  edit:<><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14.5 6.5 3 3"/></>,
  arrowLeft:<><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></>,
  arrowRight:<><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  check:<><path d="m5 12 4 4L19 6"/></>,
  sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon:<><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></>,
  link:<><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.2-1.2"/></>,
  money:<><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></>,
  menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]||p.info}</svg>
}

const money=(v:any)=>v==null||v===""?"—":`${Number(v).toLocaleString("fr-FR")} FCFA`;
export function Card({children,className=""}:{children:ReactNode;className?:string}){return <section className={`card ${className}`}>{children}</section>}
export function Badge({children,tone="neutral"}:{children:ReactNode;tone?:string}){return <span className={`badge badge-${tone}`}>{children}</span>}
export function Button({children,onClick,kind="primary",type="button",disabled=false,title}:{children:ReactNode;onClick?:()=>void;kind?:string;type?:any;disabled?:boolean;title?:string}){return <button type={type} title={title} disabled={disabled} onClick={onClick} className={`btn btn-${kind}`}>{children}</button>}
export function IconButton({name,onClick,title}:{name:string;onClick:()=>void;title:string}){return <button title={title} onClick={onClick} className="iconBtn"><Icon name={name}/></button>}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <div><label className="label">{label}</label>{children}{hint&&<small className="hint">{hint}</small>}</div>}
export function Toggle({checked,setChecked,label}:{checked:boolean;setChecked:(v:boolean)=>void;label:string}){return <button type="button" onClick={()=>setChecked(!checked)} className="toggleRow"><span className={`switch ${checked?"on":""}`}><span/></span><span>{label}</span></button>}
export function Modal({title,close,children}:{title:string;close:()=>void;children:ReactNode}){return <div className="modalBackdrop"><div className="modal"><div className="modalHead"><h2>{title}</h2><IconButton name="x" onClick={close} title={copy.fr.close}/></div>{children}</div></div>}
export function Empty({text}:{text:string}){return <div className="empty">{text}</div>}
export function SearchBar({value,setValue,placeholder}:{value:string;setValue:(v:string)=>void;placeholder:string}){return <div className="searchBar"><Icon name="search" size={17}/><input aria-label={placeholder} className="input" value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder}/>{value&&<button type="button" className="searchClear" onClick={()=>setValue("")} aria-label="Clear">×</button>}</div>}
