import {
    stringify
} from 'querystring';

import {
    HLTVConfig
} from '../config/configuration';

import {
    HLTVScraper
} from '../utils/scraper';
import {
    generateRandomSuffix,
    getIdAt,
    parseNumber
} from '../utils/utils';
import {
    fetchPage
} from '../utils/fetch';

import {
    fromMapSlug,
    toMapFilter
} from '../types/shared/GameMap';
import {
    FullPlayerStats,
    GetPlayerStatsArguments
} from '../types/getPlayerStats';

export const getPlayerStats =
    (config: HLTVConfig) =>
        async (options: GetPlayerStatsArguments): Promise<FullPlayerStats> => {
            const query = stringify({
                ...(options.startDate ? { startDate: options.startDate } : {}),
                ...(options.endDate ? { endDate: options.endDate } : {}),
                ...(options.matchType ? { matchType: options.matchType } : {}),
                ...(options.rankingFilter
                    ? { rankingFilter: options.rankingFilter }
                    : {}),
                ...(options.maps ? { maps: options.maps.map(toMapFilter) } : {}),
                ...(options.bestOfX ? { bestOfX: options.bestOfX } : {}),
                ...(options.eventIds ? { event: options.eventIds } : {})
            })

            const [$, i$, m$] = await Promise.all([
                fetchPage(
                    `https://www.hltv.org/stats/players/${options.id
                    }/${generateRandomSuffix()}?${query}`,
                    config.loadPage
                ).then(HLTVScraper),
                fetchPage(
                    `https://www.hltv.org/stats/players/individual/${options.id
                    }/${generateRandomSuffix()}?${query}`,
                    config.loadPage
                ).then(HLTVScraper),
                fetchPage(
                    `https://www.hltv.org/stats/players/matches/${options.id
                    }/${generateRandomSuffix()}?${query}`,
                    config.loadPage
                ).then(HLTVScraper)
            ])

            const nameText = $('.summaryRealname div').text()
            const name = nameText === '-' ? undefined : nameText
            const ign = $('.context-item-name').text()

            const imageUrl =
                $('.summaryBodyshot').attr('src') || $('.summarySquare').attr('src')
            const image = imageUrl.includes('bodyshot/unknown.png')
                ? undefined
                : imageUrl

            const age = $('.summaryPlayerAge').textThen((x) =>
                parseNumber(x.split(' ')[0])
            )

            const country = {
                name: $('.summaryRealname .flag').attr('title')!,
                code: $('.summaryRealname .flag').attrThen(
                    'src',
                    (x) => x.split('/').pop()?.split('.')[0]!
                )
            }

            const team =
                $('.SummaryTeamname').text() !== 'No team'
                    ? {
                        name: $('.SummaryTeamname a').text(),
                        id: Number($('.SummaryTeamname a').attrThen('href', getIdAt(3)))
                    }
                    : undefined

            const getOverviewStats = (label: string): number | undefined => {
                const lbl = label.toLowerCase()
                const row = $('.stats-row').filter((_, x) =>
                    x.text().toLowerCase().includes(lbl)
                )
                if (row.exists()) {
                    return Number(row.find('span').eq(1).text().replace('%', ''))
                }
            }

            const overviewStatistics = {
                kills: getOverviewStats('Total kills')!,
                headshots: getOverviewStats('Headshot %')!,
                deaths: getOverviewStats('Total deaths')!,
                kdRatio: getOverviewStats('K/D Ratio')!,
                damagePerRound: getOverviewStats('Damage / Round'),
                grenadeDamagePerRound: getOverviewStats('Grenade dmg / Round'),
                mapsPlayed: getOverviewStats('Maps played')!,
                roundsPlayed: getOverviewStats('Rounds played')!,
                killsPerRound: getOverviewStats('Kills / round')!,
                assistsPerRound: getOverviewStats('Assists / round')!,
                deathsPerRound: getOverviewStats('Deaths / round')!,
                savedByTeammatePerRound: getOverviewStats('Saved by teammate'),
                savedTeammatesPerRound: getOverviewStats('Saved teammates'),
                ...(getOverviewStats('Rating 1.0') !== undefined
                    ? { rating1: getOverviewStats('Rating 1.0') }
                    : { rating2: getOverviewStats('Rating 2.0') })
            }

            const getIndivialStats = (label: string): number => {
                const lbl = label.toLowerCase()
                const row = i$('.stats-row').filter((_, x) =>
                    x.text().toLowerCase().includes(lbl)
                )
                return Number(row.find('span').eq(1).text().replace('%', ''))
            }

            const individualStatistics = {
                roundsWithKills: getIndivialStats('Rounds with kills'),
                zeroKillRounds: getIndivialStats('0 kill rounds'),
                oneKillRounds: getIndivialStats('1 kill rounds'),
                twoKillRounds: getIndivialStats('2 kill rounds'),
                threeKillRounds: getIndivialStats('3 kill rounds'),
                fourKillRounds: getIndivialStats('4 kill rounds'),
                fiveKillRounds: getIndivialStats('5 kill rounds'),
                openingKills: getIndivialStats('Total opening kills'),
                openingDeaths: getIndivialStats('Total opening deaths'),
                openingKillRatio: getIndivialStats('Opening kill ratio'),
                openingKillRating: getIndivialStats('Opening kill rating'),
                teamWinPercentAfterFirstKill: getIndivialStats(
                    'Team win percent after first kill'
                ),
                firstKillInWonRounds: getIndivialStats('First kill in won rounds'),
                rifleKills: getIndivialStats('Rifle kills'),
                sniperKills: getIndivialStats('Sniper kills'),
                smgKills: getIndivialStats('SMG kills'),
                pistolKills: getIndivialStats('Pistol kills'),
                grenadeKills: getIndivialStats('Grenade'),
                otherKills: getIndivialStats('Other')
            }

            const matches = m$('.stats-table tbody tr')
                .toArray()
                .map((el) => {
                    const [kills, deaths] = el
                        .find('td')
                        .eq(4)
                        .text()
                        .split(' - ')
                        .map(Number)

                    return {
                        mapStatsId: Number(el
                            .find('td')
                            .first()
                            .find('a')
                            .attrThen('href', getIdAt(4))!),
                        date: el.find('.time').numFromAttr('data-unix')!,
                        team1: {
                            id: Number(el
                                .find('td')
                                .eq(1)
                                .find('.gtSmartphone-only a')
                                .attrThen('href', getIdAt(3))),
                            name: el.find('td').eq(1).find('a span').text()
                        },
                        team2: {
                            id: Number(el
                                .find('td')
                                .eq(2)
                                .find('.gtSmartphone-only a')
                                .attrThen('href', getIdAt(3))),
                            name: el.find('td').eq(2).find('a span').text()
                        },
                        map: fromMapSlug(el.find('.statsMapPlayed').text()),
                        kills,
                        deaths,
                        rating: el.find('td').last().numFromText()!
                    }
                })

            return {
                id: options.id,
                name,
                ign,
                image,
                age,
                country,
                team,
                overviewStatistics,
                individualStatistics,
                matches
            }
        }
