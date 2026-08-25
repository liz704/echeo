"use client";
import { Icon, Card, Badge, Button, IconButton, Field, Toggle, Modal, Empty, SearchBar } from "@/components/ui";
import { money, dateFr, initials, recurrenceOptions, monthGroups, monthLabel } from "@/lib/utils";
import { Stat } from "@/components/dashboard/Stat";
export function Statistics({stats,history,reminders,groups,t}:any){
 const totalReceived=history.reduce((s:any,h:any)=>s+(Number(h.amountPaid)||0),0);
 const totalExpected=history.reduce((s:any,h:any)=>s+(Number(h.expectedAmount)||0),0);
 const partial=history.filter((h:any)=>h.status==="PARTIAL").length;
 const over=history.filter((h:any)=>h.status==="OVERPAID").length;
 const complete=history.filter((h:any)=>h.status==="COMPLETE").length;
 const paidReminders=reminders.filter((x:any)=>x.paid||x.isPaid).length;
 const activeReminders=reminders.filter((x:any)=>!(x.paid||x.isPaid)).length;
 const collectionRate=reminders.length?Math.round((paidReminders/reminders.length)*100):0;
 const overdueRate=reminders.length?Math.round((stats.overdue/reminders.length)*100):0;
 const avg=history.length?totalReceived/history.length:0;
 const maxBar=Math.max(complete,partial,over,1);
 const bars=[{label:t("completedPayments"),value:complete,tone:"success"},{label:t("partialPayments"),value:partial,tone:"warning"},{label:t("surplusPayments"),value:over,tone:"cyan"}];
 return <div className="stack">
  <div className="pageIntro"><div><p>{t("statsTitle")}</p><small className="muted">{t("paymentBreakdown")}</small></div></div>
  <div className="statGrid"><Stat title={t("totalReminders")} value={reminders.length} icon="clock"/><Stat title={t("totalAmount")} value={money(totalReceived)} icon="money" tone="cyan"/><Stat title={t("completedPayments")} value={complete} icon="check" tone="success"/><Stat title={t("overdueCount")} value={stats.overdue} icon="history" tone="danger"/></div>
  <div className="twoCol">
   <Card><div className="cardHead"><div><h2>{t("paymentBreakdown")}</h2><small>COMPLETE · PARTIAL · OVERPAID</small></div></div>
    <div className="bars">{bars.map(b=><div className="barRow" key={b.label}><div className="barMeta"><span>{b.label}</span><b>{b.value}</b></div><div className="barTrack"><div className={`barFill bar-${b.tone}`} style={{width:`${Math.max(6,(b.value/maxBar)*100)}%`}}/></div></div>)}</div>
    <div className="statMiniGrid"><div className="infoBox"><small>{t("collectionRate")}</small><b>{collectionRate}%</b><div className="miniTrack"><div className="miniFill success" style={{width:`${collectionRate}%`}}/></div></div><div className="infoBox"><small>{t("overdueRate")}</small><b>{overdueRate}%</b><div className="miniTrack"><div className="miniFill danger" style={{width:`${overdueRate}%`}}/></div></div></div>
   </Card>
   <Card><div className="cardHead"><div><h2>{t("expectedVsReceived")}</h2><small>{t("history")}</small></div></div>
    <div className="compareRow"><div><small>Attendu (historique)</small><strong>{money(totalExpected)}</strong></div><div><small>Reçu</small><strong className="successText">{money(totalReceived)}</strong></div></div>
    <div className="compareRow"><div><small>{t("avgPayment")}</small><strong>{money(avg)}</strong></div><div><small>{t("groups")}</small><strong>{groups?.length||0}</strong></div></div>
    <div className="compareRow"><div><small>{t("active")}</small><strong>{activeReminders}</strong></div><div><small>{t("completed")}</small><strong>{paidReminders}</strong></div></div>
   </Card>
  </div>
  <Card><div className="cardHead"><div><h2>{t("recentOps")}</h2><small>{history.length} opération(s)</small></div></div>
   <div className="list">{history.slice(0,10).map((h:any)=><div className="listRow" key={h.id}><div className="min0 grow"><b>{h.status}</b><small>{h.reminderType} · #{h.reminderId} · {h.paidAt?new Date(h.paidAt).toLocaleString("fr-FR"):"—"}</small></div><div className="right"><strong>{money(h.amountPaid)}</strong><small className="muted">/{money(h.expectedAmount)}</small></div></div>)}{!history.length&&<Empty text={t("noPayments")}/>}</div>
  </Card>
 </div>}
