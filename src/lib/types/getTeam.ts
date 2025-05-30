import { Article } from "./shared/Article"
import { Country } from "./shared/Country"
import { Player } from "./shared/Player"

export enum TeamPlayerType {
    Coach = 'Coach',
    Starter = 'Starter',
    Substitute = 'Substitute',
    Benched = 'Benched'
}

export interface FullTeamPlayer extends Player {
    type: TeamPlayerType
    timeOnTeam: string
    mapsPlayed: number
}

export interface FullTeam {
    id: number
    name: string
    logo?: string
    facebook?: string
    twitter?: string
    instagram?: string
    country: Country
    rank?: number
    players: FullTeamPlayer[]
    rankingDevelopment: number[]
    news: Article[]
}