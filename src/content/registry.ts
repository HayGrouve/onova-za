// Every published project, in editorial order: own work first, newest and
// most alive on top. Adding a project means one folder and one line here.
// On the home page featured labels take two rows and alternate sides, so
// within a group the order also decides the layout.
import dialIn from './projects/dial-in'
import dictum from './projects/dictum'
import onovaZaKlientite from './projects/onova-za-klientite'
import onovaZaImotite from './projects/onova-za-imotite'
import onovaZaKuhnyata from './projects/onova-za-kuhnyata'
import onovaZaSmetkata from './projects/onova-za-smetkata'
import spisakZaKamping from './projects/spisak-za-kamping'

export const registry = [
  onovaZaSmetkata,
  onovaZaImotite,
  onovaZaKuhnyata,
  spisakZaKamping,
  dialIn,
  dictum,
  onovaZaKlientite,
]
