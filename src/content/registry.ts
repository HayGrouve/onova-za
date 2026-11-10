// Every published project, in editorial order: own work first, newest and
// most alive on top. Adding a project means one folder and one line here.
// On the home page featured labels take two rows and alternate sides, so
// within a group the order also decides the layout.
import chef from './projects/chef'
import dictum from './projects/dictum'
import onovaZaKlientite from './projects/onova-za-klientite'
import onovaZaImotite from './projects/onova-za-imotite'
import onovaZaKafeto from './projects/onova-za-kafeto'
import onovaZaSmetkata from './projects/onova-za-smetkata'
import spisakZaKamping from './projects/spisak-za-kamping'

export const registry = [
  onovaZaSmetkata,
  onovaZaImotite,
  chef,
  spisakZaKamping,
  onovaZaKafeto,
  dictum,
  onovaZaKlientite,
]
