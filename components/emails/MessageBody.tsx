"use client";
import { Icon, Card, Badge, Button, IconButton, Field, Toggle, Modal, Empty, SearchBar } from "@/components/ui";
export function MessageBody({body}:{body:string}){
 const parts=(body||"").split(/(https?:\/\/[^\s]+)/g);
 return <div className="messageBody">{parts.map((part,i)=>part.startsWith("http://")||part.startsWith("https://")?<a key={i} href={part} target="_blank" rel="noreferrer" className="messageLink"><Icon name="link" size={16}/> Payer / ouvrir le lien</a>:<span key={i}>{part}</span>)}</div>
}

