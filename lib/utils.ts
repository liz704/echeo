export const money=(v:any)=>v==null||v===""?"—":`${Number(v).toLocaleString("fr-FR")} FCFA`;
export const dateFr=(v:any)=>v?new Date(`${v}T00:00:00`).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):"—";
export const initials=(name:string)=>name?.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()||"E";
export const recurrenceOptions=(c:any):string=>({NONE:"none",DAILY:"daily",WEEKLY:"weekly",MONTHLY:"monthly",YEARLY:"yearly"} as Record<string,string>)[c]||"none";
export const monthGroups=(items:any[],dateKey="dueDate",desc=false)=>{const out:any={};const sorted=[...items].sort((a,b)=>{const av=String(a?.[dateKey]||"");const bv=String(b?.[dateKey]||"");return desc?bv.localeCompare(av):av.localeCompare(bv)});sorted.forEach(x=>{const d=x?.[dateKey];const key=d?String(d).slice(0,7):"unknown";(out[key]??=[]).push(x)});return Object.entries(out)};
export const monthLabel=(key:string)=>key==="unknown"?"—":new Date(`${key}-01T00:00:00`).toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
export const monthOnlyLabel=(key:string)=>key==="unknown"?"—":new Date(`${key}-01T00:00:00`).toLocaleDateString("fr-FR",{month:"long"});
export const yearMonthGroups=(items:any[],dateKey="dueDate",desc=false):[string,[string,any[]][]][]=>{const byMonth=monthGroups(items,dateKey,desc) as [string,any[]][];const order:string[]=[];const byYear:Record<string,[string,any[]][]>={};byMonth.forEach(([key,its])=>{const y=key==="unknown"?"unknown":key.slice(0,4);if(!byYear[y]){byYear[y]=[];order.push(y)}byYear[y].push([key,its])});return order.map(y=>[y,byYear[y]])};
export const yearLabel=(y:string)=>y==="unknown"?"—":y;
