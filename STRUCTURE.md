# Organisation du frontend Échéo

Le frontend a été réorganisé par responsabilité pour faciliter la lecture et les modifications.

- `app/` : pages Next.js et routes
- `components/ui.tsx` : composants UI réutilisables (boutons, cartes, modales, icônes, champs)
- `components/common/` : éléments communs comme la marque
- `components/auth/` : connexion, inscription et récupération du mot de passe
- `components/dashboard/` : tableau de bord et statistiques visuelles réutilisables
- `components/reminders/` : rappels personnels
- `components/groups/` : groupes, membres et échéances de groupe
- `components/events/` : détail et actions d'une échéance
- `components/history/` : historique
- `components/emails/` : messages envoyés et affichage du contenu
- `components/statistics/` : statistiques globales
- `components/settings/` : paramètres
- `components/help/` : centre d'aide
- `components/about/` : présentation d'Échéo
- `lib/` : configuration, traductions et fonctions utilitaires
- `types/` : types TypeScript partagés
- `public/` : fichiers statiques

`app/page.tsx` conserve principalement l'état de l'application, les appels API et l'orchestration des écrans.
