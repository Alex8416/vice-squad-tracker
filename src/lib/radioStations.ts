// Sender und Songs fürs Vice-Squad-Radio.
// Songs liegen in public/radio/. Um einen Song umzuziehen, einfach den Eintrag in einen anderen Sender verschieben.
// `duration` (Sekunden) wird gebraucht, damit jeder Sender „live“ weiterläuft und alle dasselbe hören.

export interface Track {
  file: string
  title: string
  duration: number
}

export interface Station {
  id: string
  name: string
  freq: string
  genre: string
  color: string
  tracks: Track[]
  /** Live im Browser erzeugte Musik statt Dateien */
  synth?: boolean
}

const t = (file: string, duration: number): Track => ({
  file,
  title: file.replace(/\.mp3$/i, '').replace(/_/g, ' '),
  duration,
})

export const STATIONS: Station[] = [
  {
    id: 'neon',
    name: 'NEON',
    freq: '88.8',
    genre: 'Synthwave & Outrun',
    color: '#ff2e88',
    tracks: [t('Outrun_the_Blue_Lights.mp3', 177.5), t('The_Midnight_Heat.mp3', 181.55), t('Satellite_Light.mp3', 182.75)],
  },
  {
    id: 'block',
    name: 'BLOCK',
    freq: '101.5',
    genre: 'Hip-Hop & Rap',
    color: '#ffd23f',
    tracks: [t('Crown_of_the_Block.mp3', 178.0), t('Pavement_Royalty.mp3', 182.7)],
  },
  {
    id: 'route',
    name: 'ROUTE',
    freq: '94.3',
    genre: 'Rock & Highway',
    color: '#ff8a3d',
    tracks: [t('Breaking_Through_The_Wall.mp3', 181.94), t('Westward_Into_The_Haze.mp3', 176.35)],
  },
  {
    id: 'palmwave',
    name: 'PALM WAVE',
    freq: '77.7',
    genre: 'Live-Synth, endlos',
    color: '#00e5d4',
    tracks: [{ file: '', title: 'Endlos-Jam aus dem Studio', duration: 0 }],
    synth: true,
  },
]

export const trackUrl = (file: string) => `${import.meta.env.BASE_URL}radio/${encodeURIComponent(file)}`
