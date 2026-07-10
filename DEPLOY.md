# Mystica.pro — Déploiement sur VPS

Déploiement one-shot sur un VPS Kali Linux / Debian avec **nginx + certbot** (HTTPS automatique).

## Prérequis côté serveur

| Composant | Comment |
|---|---|
| **OS** | Kali Linux 2024+ ou Debian 12+ |
| **Accès root** | `ssh root@76.13.16.228` |
| **DNS** | `A mystica.pro → 76.13.16.228` (et `A www.mystica.pro → 76.13.16.228` recommandé) |
| **Ports 80/443** | ouverts dans le firewall |

## Étape 1 — Ajouter la clé SSH à GitHub (une seule fois)

Depuis ton PC local, copie le contenu de la clé publique :

```bash
cat ~/.ssh/mystica_deploy.pub
```

Va sur **https://github.com/Seka35/mystica/settings/keys/new** et colle-la :

- **Title** : `Mystica VPS deploy`
- **Key** : contenu du `.pub`
- Coche **Allow write access** si tu veux aussi pouvoir `git push` depuis le VPS

## Étape 2 — Copier la clé privée sur le VPS

```bash
scp ~/.ssh/mystica_deploy root@mystica.pro:/root/.ssh/
```

(ou `root@76.13.16.228` si le DNS n'est pas encore propagé)

## Étape 3 — Cloner le repo et lancer le script

```bash
ssh root@mystica.pro
chmod 600 /root/.ssh/mystica_deploy

git clone git@github.com:Seka35/mystica.git /var/www/mystica
cd /var/www/mystica
chmod +x deploy.sh
sudo ./deploy.sh
```

Le script va :
1. Te demander `MINIMAX_API_KEY` (une seule fois)
2. Installer Node.js 20 + nginx + certbot
3. Configurer nginx + obtenir le certificat SSL
4. Builder l'app Next.js
5. Démarrer le service systemd

⏱ Durée : ~5 minutes.

## Étape 4 — Vérifier

```bash
systemctl status mystica
systemctl status nginx
curl -I https://mystica.pro
```

Ouvre https://mystica.pro dans un navigateur. 🎴

---

## Mises à jour

```bash
ssh root@mystica.pro
cd /var/www/mystica
sudo ./deploy.sh    # git pull + rebuild + restart automatique
```

## Logs utiles

```bash
journalctl -u mystica -f          # app Next.js
journalctl -u nginx -f            # nginx
tail -f /var/log/nginx/error.log  # erreurs nginx détaillées
```

## Renouvellement SSL

Certbot installe un timer systemd qui renouvelle automatiquement les certifs.
Vérification :

```bash
systemctl list-timers | grep certbot
certbot renew --dry-run
```

## Troubleshooting

| Symptôme | Cause probable | Fix |
|---|---|---|
| `Permission denied (publickey)` au clone | permissions clé privée | `chmod 600 /root/.ssh/mystica_deploy` |
| `Could not bind :80` | nginx déjà lancé sur le port | `systemctl stop nginx && systemctl start nginx` |
| Certbot échoue avec `DNS problem` | DNS pas encore propagé | attendre, puis `certbot --nginx -d mystica.pro -d www.mystica.pro` |
| App crash au démarrage | `MINIMAX_API_KEY` invalide | éditer `/var/www/mystica/.env.local`, puis `systemctl restart mystica` |
| Site accessible mais sans audio | navigateur bloque l'autoplay | l'audio démarre sur le 1er clic utilisateur (normal) |
| `EACCES` sur le port 3000 | déjà utilisé | `lsof -i :3000`, tuer le processus |