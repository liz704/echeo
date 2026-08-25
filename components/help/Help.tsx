"use client";
import { Icon, Card, Badge, Button, IconButton, Field, Toggle, Modal, Empty, SearchBar } from "@/components/ui";
export function Help({t}:any){const qs=[
[t("newReminder"),"Choisissez un titre, une date, une heure, une répétition et les rappels avant/après. Les emails partent à l’heure choisie (scheduler chaque minute)."],
[t("groups"),"Ajoutez des membres puis créez une échéance pour tout le groupe ou une sélection."],
["Récurrence","Elle n’avance PAS toute seule le jour J. Pour un rappel personnel : marquez « Fait » (ou paiement complet). Pour une échéance de groupe : quand TOUS les membres ont payé/fait, la date avance et les statuts sont réinitialisés."],
["Paiement partiel","Vous pouvez enregistrer plusieurs paiements (lien ou physique). Le solde s’accumule. Statut PARTIAL tant que le total reçu < montant attendu. COMPLETE quand le total atteint ou dépasse."],
["Activité non faite","Elle reste en attente. Les relances « après » continuent d’être envoyées. Aucune avance automatique de récurrence."],
[t("paymentLink"),"Le bouton lien génère et copie un URL /pay/... à envoyer au membre. C’est normal qu’il soit dans le détail de l’échéance. Le membre ouvre le lien et indique le montant payé."],
[t("emails"),"Configurez MAIL_USERNAME et MAIL_PASSWORD (mot de passe d’application Gmail) dans le backend. Les envois apparaissent dans Messages envoyés (SENT ou FAILED avec le motif)."]
];return <div className="responsiveGrid">{qs.map(([a,b])=><Card key={a}><h3>{a}</h3><p className="muted">{b}</p></Card>)}</div>}
