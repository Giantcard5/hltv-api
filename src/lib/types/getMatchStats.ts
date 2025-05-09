import { 
    PlayerStats, 
    TeamsPerformanceOverview 
} from './getMatchMapStats'
import { 
    MapStatsOverview 
} from './getMatchMapStats'
import { 
    Team 
} from './shared/Team'
import { 
    Event 
} from './shared/Event'

export interface FullMatchStats {
    id: number
    matchId: number
    mapStatIds: number[]
    result: {
        team1MapsWon: number
        team2MapsWon: number
    }
    date: number
    team1: Team
    team2: Team
    event: Event
    overview: MapStatsOverview
    playerStats: {
        team1: PlayerStats[]
        team2: PlayerStats[]
    }
    performanceOverview: TeamsPerformanceOverview
}