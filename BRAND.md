# Branding Workwave — Référence complète

Document source de vérité pour tout ce qui touche au visuel, à la typographie et au ton éditorial de Workwave. Extrait du code, du `CLAUDE.md` et des composants en production. À mettre à jour à chaque évolution majeure du design.

---

## 1. Identité

| Élément | Valeur |
|---|---|
| **Nom** | Workwave |
| **Raison sociale** | Workwave SAS |
| **Domaine** | workwave.fr |
| **Siège** | 3 rue des Rosiers, 86110 Craon (Vienne) |
| **SIREN** | 943 055 830 |
| **Fondateur** | Willy Gauvrit |
| **Email** | contact@workwave.fr |
| **Instagram** | @workwave.fr — `https://www.instagram.com/workwave.fr/` |

**Mission** : permettre aux particuliers de trouver facilement un pro de confiance près de chez eux, et permettre aux artisans d'être visibles sans dépendre des Pages Jaunes ou Houzz.

**Positionnement** : alternative honnête aux plateformes nationales facturées 500-600 €/mois pour 2-3 leads fantômes. 39 €/mois sans engagement, ancrage local Vienne (86), fondateur unique accessible.

**Promesse en 4 mots** : *Honnête. Simple. Local. Accessible.*

**Tagline officielle homepage** : « Tout le savoir-faire local, enfin accessible. »

---

## 2. Logo & wordmark

Pas de logo image à ce jour. **Workwave est un wordmark typographique pur** :

- **Police** : Geist Sans
- **Graisse** : `font-bold` (700) dans le header / `font-extrabold` (800) sur l'OG image
- **Tracking** : `tracking-tight` (négatif, ~-0.02em)
- **Tailles** :
  - Header : `text-xl` (20px)
  - Footer : `text-2xl` (24px)
  - OG Social : 72px
- **Couleurs** :
  - Light : `var(--text-primary)` = `#0A0A0A`
  - Dark : `#FAFAFA`
- **Casse** : « Workwave » avec W majuscule uniquement (jamais en MAJUSCULES dans l'UI, sauf OG image et Hero possible)

**À créer plus tard** : icône SVG carrée (favicon, app icon iOS, OG image alternative) en variante coral sur fond noir et vice-versa.

---

## 3. Palette de couleurs

Définies dans `app/globals.css` comme variables CSS — **toujours utiliser les variables**, jamais de hex en dur dans les composants.

### Mode clair (défaut)

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#FFFFFF` | Fond principal |
| `--bg-secondary` | `#FAFAFA` | Cards, sections alternées |
| `--bg-tertiary` | `#F3F4F6` | Éléments surélevés |
| `--text-primary` | `#0A0A0A` | Texte principal (pas du pur noir) |
| `--text-secondary` | `#6B7280` | Texte secondaire |
| `--text-tertiary` | `#71717A` | Captions, labels |
| `--border-color` | `#E5E7EB` | Bordures par défaut |
| `--border-hover` | `#D1D5DB` | Bordures au hover |
| `--accent` | `#E04A2A` | **Coral primaire** — boutons, liens actifs, badges |
| `--accent-hover` | `#C73D1F` | Coral au hover |
| `--accent-muted` | `rgba(224, 74, 42, 0.08)` | Fond de badge coral |
| `--accent-badge-text` | `#B93A1B` | Texte sur badge coral |
| `--card-bg` | `#FFFFFF` | Fond de card |
| `--card-border` | `#E5E7EB` | Bordure de card |

### Mode sombre

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#0A0A0A` | Fond principal (pas du pur noir) |
| `--bg-secondary` | `#111111` | Cards, sections alternées |
| `--bg-tertiary` | `#1A1A1A` | Éléments surélevés |
| `--text-primary` | `#FAFAFA` | Texte principal |
| `--text-secondary` | `#9CA3AF` | Texte secondaire |
| `--text-tertiary` | `#848B98` | Captions |
| `--border-color` | `#27272A` | Bordures |
| `--border-hover` | `#3F3F46` | Bordures hover |
| `--accent` | `#FF5A36` | **Coral légèrement désaturé** pour ne pas brûler les yeux |
| `--accent-hover` | `#E63E1A` | Coral hover |
| `--accent-muted` | `rgba(255, 90, 54, 0.12)` | Badge fond |
| `--accent-badge-text` | `#FF7A5E` | Texte badge coral |

### Règle d'usage du coral
> Le coral est **rare et ciblé**. Jamais pour remplir un bloc entier. Uniquement pour : boutons primaires, liens actifs, badges importants, ponctuations (le « . » du H1 hero), micro-animations.

---

## 4. Typographie

| Police | Usage | Variable CSS |
|---|---|---|
| **Geist Sans** | Toute l'UI | `var(--font-geist-sans)` |
| **Geist Mono** | SIRET, codes, identifiants techniques | `var(--font-geist-mono)` |

Importées via `next/font/google` dans `app/layout.tsx`.

### Échelle

| Élément | Taille mobile | Taille desktop | Graisse | Tracking |
|---|---|---|---|---|
| **Hero H1** | `text-4xl` (36px) | `text-7xl` (72px) | `font-extrabold` (800) | `tracking-tight` |
| **H1 page** | `text-3xl` | `text-4xl`-`text-6xl` | `font-bold`-`extrabold` | `tracking-tight` |
| **H2 section** | `text-2xl` | `text-3xl` | `font-bold` (700) | `tracking-tight` |
| **H3 card** | `text-xl` | `text-xl` | `font-bold` | normal |
| **Sous-titre/lead** | `text-lg` | `text-xl` | `font-normal` | normal |
| **Corps** | `text-base` (16px) | `text-base` | `font-normal` | normal |
| **Petit texte** | `text-sm` (14px) | `text-sm` | `font-normal` | normal |
| **Caption** | `text-xs` (12px) | `text-xs` | `font-medium`+`uppercase`+`tracking-wide` | élargi |
| **Boutons** | `text-sm` | `text-sm` | `font-semibold` (600) | normal |

**Règles strictes** :
- Line-height corps : `leading-relaxed` (1.625) ou `leading-[1.7]`
- Line-height titres massifs : `leading-[1.1]`
- Jamais en dessous de **14px** (texte secondaire) — **12px** uniquement pour les captions footer/légales
- Jamais plus de 2 polices différentes
- `font-smoothing: antialiased` activé globalement

---

## 5. Espacement et rythme

Échelle Tailwind exclusivement : **4, 8, 12, 16, 24, 32, 48, 64, 96, 128**.

| Contexte | Padding |
|---|---|
| Hero desktop | `py-24` à `py-40` (96-160px) |
| Section standard | `py-16` (64px) |
| Card | `p-6` à `p-8` (24-32px) |
| Bouton | `px-5 py-2.5` (CTA) à `px-8 py-4` (CTA hero) |
| Container max | `max-w-3xl` (texte) à `max-w-6xl` (grilles) |

**Gaps grille** : `gap-4` (16px) à `gap-8` (32px) selon densité.

**Règle d'or** : *toujours de la respiration*. Ne jamais coller deux éléments. Préférer trop d'espace que pas assez.

---

## 6. Coins arrondis

| Élément | Classe Tailwind |
|---|---|
| **Boutons CTA** | `rounded-full` |
| **Inputs / boutons secondaires** | `rounded-xl` (12px) |
| **Cards** | `rounded-2xl` (16px) |
| **Images** | `rounded-2xl` ou `rounded-3xl` (24px, hero) |
| **Badges** | `rounded-full` |
| **Icônes circulaires (avatar pro)** | `rounded-full` |

Jamais d'angles vifs sauf cas exceptionnel justifié.

---

## 7. Ombres

| Mode | Approche |
|---|---|
| **Light** | `shadow-sm` par défaut, `shadow-md` au hover. Très subtiles. |
| **Dark** | Pas d'ombres (invisibles sur noir). Remplacer par bordures plus marquées (`border-[var(--border-hover)]`). |

**Jamais** d'ombres dures, dramatiques ou colorées.

---

## 8. Boutons

### Primaire (CTA principal)
```tsx
className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]
           text-white px-5 py-2.5 rounded-full text-sm font-semibold
           transition-all duration-250 hover:scale-[1.02]"
```
Usage : « Trouver un pro », « Voir l'espace pro », « Déposer un projet »

### Secondaire
```tsx
className="bg-transparent border border-[var(--border-color)]
           text-[var(--text-primary)] px-5 py-2.5 rounded-full text-sm font-semibold
           transition-all duration-250
           hover:border-[var(--accent)] hover:text-[var(--accent)]"
```

### Tertiaire (lien)
```tsx
className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]
           link-underline transition-colors duration-250"
```

**Tailles minimum** :
- Hauteur 44px minimum (accessibilité mobile)
- CTA hero : `px-8 py-4` (~56px hauteur)

---

## 9. Cards (artisan, catégorie, contenu)

Structure standard :
```tsx
className="bg-[var(--bg-secondary)] border border-[var(--card-border)]
           rounded-2xl p-6 sm:p-8
           transition-all duration-250
           hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]"
```

**Comportement hover** :
- Translation Y : `-translate-y-1` (4px) à `-translate-y-2` (8px)
- Shadow : `shadow-md`
- Border : passe en `var(--accent)` (coral)
- Durée : 250ms ease-out

---

## 10. Animations & micro-interactions

| Cible | Durée | Easing |
|---|---|---|
| Standard | 200-250ms | `ease-out` |
| Mode toggle | 300ms | `ease-out` |
| Header scroll blur | 300ms | `ease-out` |

**Règles d'animation** :
- Boutons : `hover:scale-[1.02]` + changement couleur
- Cards : `hover:-translate-y-1` + élévation
- Liens : underline qui slide *from left* (classe `.link-underline` custom dans `globals.css`)
- Icônes : rotation/translation subtile au hover
- Compteurs (stats) : count-up au scroll (ex. « 20 000 professionnels »)
- **Jamais** de spinner générique → toujours skeletons

---

## 11. États

### Loading (skeleton)
- Classe `.skeleton` custom : gradient shimmer 1.5s
- Couleurs : `--skeleton-bg` + `--skeleton-shine`
- Mime la forme du contenu final (cercle pour avatar, lignes pour texte)

### Vide
- Une icône grande OU illustration SVG minimaliste
- Message **humain et clair** : « Aucun pro trouvé » ✅ / « Empty result set » ❌
- Toujours une action de rebond (bouton)

---

## 12. Header & navigation

| Caractéristique | Valeur |
|---|---|
| **Hauteur** | 72px |
| **Position** | Sticky top |
| **Background initial** | Transparent |
| **Background scroll** | `bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-lg` + bordure bas |
| **Layout** | Logo gauche · Nav centre · Theme toggle + CTA droite |
| **Mobile** | Hamburger + menu plein écran |

---

## 13. Footer

| Caractéristique | Valeur |
|---|---|
| **Background** | `#0A0A0A` (light) / `#111111` (dark) |
| **Texte** | Blanc / `text-zinc-400` pour les liens |
| **Padding** | `py-16 px-4`, `max-w-6xl` |
| **Structure** | Logo + tagline en haut · 4 colonnes (BTP / Domicile / Personne / Entreprise) · Copyright bas |

---

## 14. OG Image / Social preview

Génération dynamique via `next/og` (`app/opengraph-image.tsx`) :
- **Dimensions** : 1200×630
- **Fond** : `#0A0A0A`
- **Wordmark** : « Workwave » 72px / 800 / `#FAFAFA` / tracking -2px
- **Sous-titre** : « Trouvez un professionnel de confiance » 32px / `#9CA3AF`
- **Accroche coral** : « Plus de 20 000 professionnels en Vienne » 20px / `#FF5A36` / 600

---

## 15. Iconographie

- **Style** : line icons (stroke uniquement, pas de fill)
- **Stroke width** : `1.5`
- **Linecap** : `round`
- **Source** : SVG inline (Lucide / Heroicons style)
- **Couleur** : `currentColor` pour héritage CSS

Exemple (Header hamburger) :
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
     strokeWidth={1.5} strokeLinecap="round" className="w-5 h-5">
```

---

## 16. Mode sombre

- **Lib** : `next-themes`
- **Persistance** : localStorage
- **Détection** : préférence système au premier chargement
- **Toggle** : icône soleil/lune dans le header (composant `ThemeToggle`)
- **Transition** : 300ms entre les deux modes
- **Pas de flash blanc** : `suppressHydrationWarning` sur `<html>`

---

## 17. Tone of voice / éditorial

### Personnalité
**Honnête. Direct. Local. Pas corporate.**

Workwave parle comme un entrepreneur du coin qui en a marre des grosses boîtes, pas comme une plateforme tech américaine. On utilise le « tu » jamais, le « vous » oui — mais sans jargon ni hauteur.

### Lexique
- **« Pro »** > « professionnel » dans les CTA et titres courts
- **« Artisan »** quand on parle BTP spécifiquement
- **« Particulier »** > « client » (plus neutre)
- **« Lead »** uniquement côté pro / dashboard, jamais côté particulier
- **« Réclamer sa fiche »** > « créer un compte »
- **« Trouver un pro »** > « rechercher »
- **« Déposer un projet »** > « soumettre une demande »

### Phrasé type
✅ « Les pros en ont marre. »
✅ « Une fiche, un dashboard, des leads. C'est tout. »
✅ « Pas de commission cachée. Pas d'engagement annuel. »

❌ « Notre solution innovante de mise en relation »
❌ « Une expérience utilisateur premium »
❌ « Optimisez votre acquisition client »

### Ponctuation signature
- Le **« . » coral** à la fin du H1 hero (`<span className="text-[var(--accent)]">.</span>`)
- Tirets longs « — » pour les apartés (jamais le tiret court « - »)

---

## 18. Ce qu'on ne fait JAMAIS

1. Pas de **gradients criards** (seuls les très subtils sont OK)
2. Pas d'**emoji dans l'interface** (sauf cas validé)
3. Pas de **stock photos** génériques d'artisans qui sourient
4. Pas de **témoignages inventés**
5. Pas d'**ombres dramatiques ou colorées**
6. Pas plus de **2 polices différentes**
7. Pas de texte en dessous de **14px** (sauf footer légal)
8. Pas de contrastes insuffisants (WCAG AA minimum)
9. Pas de **header noir corporate** dans les emails (style email perso)
10. Pas de citation des **concurrents par leur nom** (« les autres plateformes »)
11. Pas de mention « **Craon** » ou « **86110** » dans le marketing public (ancrage Vienne sans précision géographique)

---

## 19. Composants signature à soigner

1. **Hero homepage** : H1 massif `text-7xl`, point coral final, sous-titre élégant, barre de recherche `rounded-full h-16` proéminente, compteur animé en dessous
2. **ProCard** : cercle initiale fond coral désaturé, nom `font-semibold text-lg`, badge catégorie coral, ville en gris, hover translate -4px + bordure coral
3. **Barre de recherche** : large, `rounded-full`, icône loupe, placeholder engageant (« Plombier à Poitiers ? »), suggestions dropdown élégant
4. **Header sticky** : transparent → blanc/noir + blur au scroll, transition 300ms

---

## 20. Récap quick-reference

```
Couleur signature : Coral #E04A2A (light) / #FF5A36 (dark)
Police          : Geist Sans + Geist Mono
Rayon card      : 16px (rounded-2xl)
Rayon bouton    : full
Transition      : 250ms ease-out
Hover card      : translate-y -4px + shadow + border coral
Hover bouton    : scale 1.02 + accent-hover
Ton             : honnête, direct, local, anti-corporate
Le « . » final coral = signature visuelle
```

---

## Sources

- `app/globals.css` — variables CSS et tokens de design
- `app/layout.tsx` — fonts (Geist Sans + Mono via next/font)
- `components/layout/Header.tsx` — header sticky avec blur
- `components/layout/Footer.tsx` — footer noir 4 colonnes
- `components/ui/ThemeToggle.tsx` — switch mode sombre/clair
- `app/opengraph-image.tsx` — OG image dynamique
- `CLAUDE.md` section 8 bis — Philosophie de design (référence absolue)

À mettre à jour quand un de ces fichiers évolue significativement.
