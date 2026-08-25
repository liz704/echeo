"use client";
import { Icon, Card, Badge, Button, IconButton, Empty, SearchBar } from "@/components/ui";
import { MessageBody } from "@/components/emails/MessageBody";
import { yearMonthGroups, monthOnlyLabel, yearLabel } from "@/lib/utils";
export function Emails({logs,search,setSearch,deleteEmail,clearAll,ownEmail,t}:any){
 const q=search.trim().toLowerCase();
 // On n'affiche ici que les messages destinés aux membres et ceux liés à un
 // rappel personnel. La copie de reçu envoyée en interne au propriétaire pour
 // un paiement de groupe part bien par email (comme demandé), mais elle ne
 // s'affiche pas une deuxième fois dans cette liste pour éviter l'impression
 // de doublon.
 const own=(ownEmail||"").toLowerCase();
 const visible=logs.filter((x:any)=>!(x.reminderType==="GROUP"&&own&&(x.recipient||"").toLowerCase()===own));
 const filtered=visible.filter((x:any)=>!q||`${x.subject||""} ${x.recipientName||""} ${x.recipient||""} ${x.reminderTitle||""} ${x.body||""}`.toLowerCase().includes(q));
 return <div className="stack"><div className="pageIntro"><p>{t("emails")}</p>{!!visible.length&&<Button kind="danger" onClick={clearAll}><Icon name="trash"/> {t("clearEmails")}</Button>}</div><SearchBar value={search} setValue={setSearch} placeholder={t("searchEmails")}/>{filtered.length?yearMonthGroups(filtered,"sentAt",true).map(([year,months])=><section className="yearSection" key={year}><h2 className="yearHeader">{yearLabel(year)}</h2>{months.map(([month,items]:any)=><div className="monthSection" key={month}><div className="monthHeader"><Icon name="mail" size={17}/><h3>{monthOnlyLabel(month)}</h3></div>{items.map((x:any)=><Card key={x.id}><div className="statusRow emailRow"><span className="statIcon cyan"><Icon name="mail"/></span><div className="min0 grow"><b className="wrapText">{x.subject||"Message Échéo"}</b><small className="wrapText">{t("recipient")} : {x.recipientName||"—"} · {x.recipient||"—"}</small><small className="wrapText">{x.reminderType||"—"} · {x.groupName?`${x.groupName} · `:""}{x.reminderTitle||`#${x.reminderId||"—"}`} · {x.sentAt?new Date(x.sentAt).toLocaleString("fr-FR"):"—"}</small></div><Badge tone={x.status==="SENT"?"success":"danger"}>{x.status==="SENT"?t("sent"):t("failed")}</Badge><IconButton name="trash" onClick={()=>deleteEmail(x.id)} title={t("remove")}/></div><details className="emailDetails"><summary>{t("messageDetails")}</summary><div className="emailMeta"><b>{t("subject")} :</b> {x.subject||"—"}<br/><b>{t("recipient")} :</b> {x.recipientName||"—"} · {x.recipient||"—"}<br/><b>{t("message")} :</b><MessageBody body={x.body||"—"}/>{x.errorMessage&&<p className="warningText">{x.errorMessage}</p>}</div></details></Card>)}</div>)}</section>):<Empty text={q?t("noResults"):t("messagesEmpty")}/>}</div>
}
