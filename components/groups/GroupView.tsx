"use client";
import { Icon, Card, Badge, Button, IconButton, Field, Toggle, Modal, Empty, SearchBar } from "@/components/ui";
import { money, dateFr, initials, recurrenceOptions, yearMonthGroups, monthOnlyLabel, yearLabel } from "@/lib/utils";
export function GroupView({group,members,events,setModal,setM,setEditingMember,setEditingEvent,setEv,openEvent,deleteMember,deleteEvent,t}:any){
 const today=new Date().toISOString().slice(0,10);
 return <div className="stack">
  <div className="pageIntro">
   <p>{group.description||t("groupSpaces")}</p>
   <div className="actions">
    <Button kind="secondary" onClick={()=>{setEditingMember(null);setM({name:"",email:""});setModal("member")}}><Icon name="plus"/> {t("addMember")}</Button>
    <Button onClick={()=>{setEditingEvent(null);setEv({title:"",amount:"",payment:false,dueDate:"",recurrence:"NONE",before:"3,1,0",after:"1,3,7",time:"08:00",notifyOwner:true,messageTemplate:"",all:true,ids:members.map((x:any)=>x.id)});setModal("event")}}><Icon name="plus"/> {t("newEvent")}</Button>
   </div>
  </div>
  <div className="twoCol">
   <Card>
    <div className="cardHead"><h2>{t("members")} <small>({members.length})</small></h2></div>
    <div className="list">
     {members.map((m:any)=><div className="memberRow" key={m.id}>
      <div className="avatar">{initials(m.memberName)}</div>
      <div className="min0 grow"><b>{m.memberName}</b><small>{m.memberEmail}</small></div>
      <div className="rowBtns">
       <IconButton name="edit" onClick={()=>{setEditingMember(m);setM({name:m.memberName,email:m.memberEmail});setModal("member")}} title={t("edit")}/>
       <IconButton name="trash" onClick={()=>deleteMember(m.id)} title={t("remove")}/>
      </div>
     </div>)}
     {!members.length&&<Empty text={t("noMembers")}/>}
    </div>
   </Card>
   <Card>
    <div className="cardHead"><div><h2>{t("groupDue")}</h2><small>{events.length} échéance(s)</small></div></div>
    <div className="list">
     {yearMonthGroups(events).map(([year,months])=><div key={year} className="eventYear">
      <div className="miniYear">{yearLabel(year)}</div>
      {months.map(([month,items]:any)=><div key={month} className="eventMonth">
      <div className="miniMonth">{monthOnlyLabel(month)}</div>
      {items.map((e:any)=>{
        const overdue=e.dueDate<today;
        const hasRec=e.recurrence&&e.recurrence!=="NONE";
        return <button className={`eventRow ${overdue?"overdueRow":""}`} key={e.id} onClick={()=>openEvent(e)}>
         <div className="dateBox compact"><b>{new Date(`${e.dueDate}T00:00:00`).getDate()}</b><small>{new Date(`${e.dueDate}T00:00:00`).toLocaleDateString("fr-FR",{month:"short"})}</small></div>
         <div className="min0 grow">
          <b>{e.title}</b>
          <small>
            {dateFr(e.dueDate)}
            {hasRec?` · ${e.recurrenceActive===false?t("recurrenceStopped"):t(recurrenceOptions(e.recurrence) as any)}`:""}
            {e.reminderTime?` · ${(e.reminderTime+"").slice(0,5)}`:""}
          </small>
         </div>
         <div className="eventBadges">
          {e.currentStatus==="DONE"&&<Badge tone="success">{t("statusDone")}</Badge>}
          {e.currentStatus==="OVERPAID"&&<Badge tone="info">{t("statusOverpaid")}</Badge>}
          {e.currentStatus==="PARTIAL"&&<Badge tone="warning">{t("statusPartial")}</Badge>}
          {e.currentStatus==="PARTIAL_OVERDUE"&&<Badge tone="danger">{t("statusPartialOverdue")}</Badge>}
          {e.currentStatus==="IN_PROGRESS"&&<Badge tone="info">{t("statusInProgress")}</Badge>}
          {e.currentStatus==="IN_PROGRESS_OVERDUE"&&<Badge tone="danger">{t("statusInProgress")} · {t("overdue")}</Badge>}
          {e.currentStatus==="OVERDUE"&&<Badge tone="danger">{t("statusOverdue")}</Badge>}
          {e.currentStatus!=="DONE"&&e.currentStatus!=="OVERPAID"&&e.currentStatus!=="PARTIAL"&&e.currentStatus!=="PARTIAL_OVERDUE"&&e.currentStatus!=="IN_PROGRESS"&&e.currentStatus!=="IN_PROGRESS_OVERDUE"&&e.currentStatus!=="OVERDUE"&&<Badge tone="info">{t("upcoming")}</Badge>}
          {e.amount!=null&&<Badge tone="neutral">{money(e.amount)}{e.totalMembers?` · ${e.completedMembers}/${e.totalMembers}`:""}</Badge>}
         </div>
         <Icon name="arrowRight"/>
        </button>;
      })}
     </div>)}
     </div>)}
     {!events.length&&<Empty text={t("noGroupDue")}/>}
    </div>
   </Card>
  </div>
 </div>}
