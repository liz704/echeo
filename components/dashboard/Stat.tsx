"use client";
import { Icon, Card, Badge, Button, IconButton, Field, Toggle, Modal, Empty, SearchBar } from "@/components/ui";
export function Stat({title,value,icon,tone="dark"}:any){return <Card className="stat"><span className={`statIcon ${tone}`}><Icon name={icon}/></span><div><small>{title}</small><strong>{value}</strong></div></Card>}
