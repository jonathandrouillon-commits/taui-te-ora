/** TAUI TE ORA - Installation prudente des notifications privees d'observations.
 * Executer depuis la racine du projet: node installer-notifications-observations.cjs
 * Le script sauvegarde les deux fichiers, et ne modifie rien si les reperes manquent.
 */
const fs = require('node:fs');
const path = require('node:path');
const files = {
  api: 'app/api/signalement/observations/route.ts',
  page: 'app/notifications/page.tsx',
};
for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) throw new Error(`Fichier manquant (${name}): ${file}`);
}
let api = fs.readFileSync(files.api, 'utf8');
let page = fs.readFileSync(files.page, 'utf8');
const marker = 'TAUI_OBSERVATION_PRIVATE_NOTIFICATIONS_V1';
if (api.includes(marker)) throw new Error('Notifications deja installees dans API : aucune modification.');
if (page.includes(marker)) throw new Error('Redirection deja installee : aucune modification.');
const insertAnchor = /\n(\s*)return response\(\s*\{\s*ok:\s*true,\s*observation_id:\s*data\.id,/;
if (!insertAnchor.test(api)) throw new Error('Reponse de creation observation introuvable : aucune modification.');
const code = `
    // TAUI_OBSERVATION_PRIVATE_NOTIFICATIONS_V1
    // Ne jamais inclure les donnees du temoin dans une notification.
    // Une notification n'implique pas que l'animal a ete retrouve.
    try {
      const recipients = new Set<string>();
      if (report.user_id) recipients.add(String(report.user_id));

      const { data: adminProfiles, error: adminError } = await db
        .from("profiles")
        .select("id,role,is_active")
        .in("role", ["admin", "administrateur"])
        .eq("is_active", true);

      if (adminError) {
        console.error("Administrateurs pour observations :", adminError);
      } else {
        for (const adminProfile of adminProfiles || []) {
          if (adminProfile.id) recipients.add(String(adminProfile.id));
        }
      }

      if (recipients.size > 0) {
        const rows = Array.from(recipients).map((recipientId) => ({
          recipient_id: recipientId,
          type: "nouvelle_observation",
          title: "Nouvelle observation d'un animal",
          message: "Un temoin a transmis une information. Consultez cette piste privee.",
          signalement_id: id,
          is_read: false,
          read_at: null,
        }));
        const { error: notificationError } = await db
          .from("notifications")
          .insert(rows);
        if (notificationError) {
          console.error("Notifications privees observation :", notificationError);
        }
      }
    } catch (notificationError) {
      // L'observation reste enregistree meme si la notification echoue.
      console.error("Creation notifications observation :", notificationError);
    }
`;
api = api.replace(insertAnchor, '\n' + code + '$&');
const routeAnchor = /(\n\s*if\s*\(\s*notification\s*\.\s*signalement_id\s*\)\s*\{\s*return\s*`\/signalement\/\$\{notification\.signalement_id\}`;\s*\})/m;
if (!routeAnchor.test(page)) throw new Error('Route signalement attendue introuvable : aucune modification.');
page = page.replace(routeAnchor, `
    // TAUI_OBSERVATION_PRIVATE_NOTIFICATIONS_V1
    if (
      notification.type === "nouvelle_observation" &&
      notification.signalement_id
    ) {
      return \`/signalements/observations/\${notification.signalement_id}\`;
    }
$1`);
const backupDir = path.join('backup-notifications-observations-' + new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(backupDir, { recursive: true });
for (const file of Object.values(files)) {
  const target = path.join(backupDir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
fs.writeFileSync(files.api, api, 'utf8');
fs.writeFileSync(files.page, page, 'utf8');
console.log('Installation terminee. Sauvegardes :', backupDir);
console.log('Verifier : node node_modules\\next\\dist\\bin\\next build');
console.log('IMPORTANT : verifier les politiques RLS sur notifications et medias prives avant mise en production.');
