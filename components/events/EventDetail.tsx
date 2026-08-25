"use client";
import { Icon, Card, Badge, Button, IconButton, Field, Toggle, Modal, Empty, SearchBar } from "@/components/ui";
import { money, dateFr, initials, recurrenceOptions, monthGroups, monthLabel } from "@/lib/utils";
export function EventDetail({event,statuses,close,edit,deleteEvent,generateLink,physicalPayment,markMemberDone,t,toggleRecurrence}:any){
 const doneCount=statuses.filter((s:any)=>s.done||s.paymentStatus==="COMPLETE").length;
 const partialCount=statuses.filter((s:any)=>s.paymentStatus==="PARTIAL").length;
 const pendingCount=statuses.length-doneCount;
 const hasRec=event.recurrence&&event.recurrence!=="NONE";
 return <Modal title={event.title} close={close}>
  <div className="stack">
   <div className="two">
    <div className="infoBox"><small>{t("dueDate")}</small><b>{dateFr(event.dueDate)}</b></div>
    <div className="infoBox"><small>{t("amount")}</small><b>{event.amount!=null?money(event.amount):"—"}</b></div>
   </div>
   <div className="two">
    <div className="infoBox"><small>{t("recurrence")}</small><b>{hasRec?t(recurrenceOptions(event.recurrence) as any):t("none")}</b></div>
    <div className="infoBox"><small>Progression</small><b>{doneCount}/{statuses.length||0} réglé(s){partialCount?` · ${partialCount} partiel(s)`:""}</b></div>
   </div>
   {hasRec&&<p className="hint">{event.recurrenceActive===false?t("recurrenceStopped"):<>Quand tous les membres ont payé/fait, la date avance automatiquement ({t(recurrenceOptions(event.recurrence) as any)}).</>}</p>}
   <div className="actions">
    {event.editable!==false?<Button kind="secondary" onClick={edit}><Icon name="edit"/> {t("edit")}</Button>:<span className="hint">{t("lockedEdit")}</span>}
    <Button kind="danger" onClick={()=>deleteEvent(event.id)}><Icon name="trash"/> {t("remove")}</Button>{hasRec&&<Button kind="secondary" onClick={()=>toggleRecurrence(event)}>{event.recurrenceActive===false?t("resumeRecurrence"):t("stopRecurrence")}</Button>}
   </div>
   <div className="list">
    {statuses.map((s:any)=>{
      const isDone=s.done||s.paymentStatus==="COMPLETE";
      const isPartial=s.paymentStatus==="PARTIAL";
      const isPartialOverdue=isPartial && event.dueDate < new Date().toISOString().slice(0,10);
      return <div className="statusRow" key={s.id}>
       <div className="avatar">{initials(s.member?.memberName)}</div>
       <div className="min0 grow">
        <b>{s.member?.memberName}</b>
        <small>{s.member?.memberEmail}</small>
        {s.amountPaid!=null&&Number(s.amountPaid)>0&&(
          <small>Reçu : {money(s.amountPaid)}{Number(s.balance)>0?` · Reste : ${money(s.balance)}`:""}</small>
        )}
       </div>
       <Badge tone={isDone?"success":isPartialOverdue?"danger":isPartial?"warning":"neutral"}>
        {isDone?t("done"):isPartialOverdue?t("statusPartialOverdue"):isPartial?t("partial"):t("pending")}
       </Badge>
       {!isDone&&(
         <div className="rowBtns">
          {event.amount!=null&&<>
            <IconButton name="link" onClick={()=>generateLink("GROUP",event.id,s.member.id)} title={t("paymentLink")}/>
            <IconButton name="money" onClick={()=>physicalPayment(s.member.id)} title={t("physicalPayment")}/>
          </>}
          {event.amount==null&&<IconButton name="check" onClick={()=>markMemberDone(s.id)} title={t("markMemberDone")}/>}
         </div>
       )}
      </div>;
    })}
    {!statuses.length&&<Empty text={t("noMembers")}/>}
   </div>
   {event.amount!=null&&pendingCount>0&&(
     <p className="hint">Le bouton lien copie un lien de paiement à envoyer au membre. Le bouton argent enregistre un paiement physique (cash). Vous pouvez encaisser plusieurs fois (paiement partiel) jusqu’au montant attendu.</p>
   )}
  </div>
 </Modal>}
