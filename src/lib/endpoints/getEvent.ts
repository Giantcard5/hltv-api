import {
    HLTVConfig
} from '../config/configuration';
import {
    HLTVScraper
} from '../utils/scraper';

import {
    generateRandomSuffix,
    getIdAt,
    notNull,
    parseNumber
} from '../utils/utils';
import {
    fetchPage
} from '../utils/fetch';

import {
    fromMapName
} from '../types/shared/GameMap';

import {
    FullEvent,
    FullEventPrizeDistribution
} from '../types/getEvent';
import {
    Event
} from '../types/shared/Event';

export const getEvent = (config: HLTVConfig) => {
    return async ({ id }: { id: number }): Promise<FullEvent> => {
        const $ = HLTVScraper(
            await fetchPage(
                `https://www.hltv.org/events/${id}/${generateRandomSuffix()}`,
                config.loadPage
            )
        );

        const name = $('.event-hub-title').text();
        const logo = $('.sidebar-first-level').find('.event-logo').attr('src');
        const prizePool = $('td.prizepool').text();

        const dateStart = $('td.eventdate span[data-unix]').first().numFromAttr('data-unix');
        const dateEnd = $('td.eventdate span[data-unix]').last().numFromAttr('data-unix');

        const location = {
            name: $('.location span.text-ellipsis').text(),
            code: $('img.flag').attr('src').split('/').pop()!.split('.')[0]
        };

        const relatedEvents = $('.related-event').toArray().map((el) => ({
            name: el.find('.event-name').text(),
            id: el.find('a').attrThen('href', getIdAt(2))
        }));

        const prizeDistribution = $('.placements .placement').toArray().map((el) => {
            const otherPrize = el.find('.prize').first().next().text() || undefined;

            const qualifiesFor = !!otherPrize ? relatedEvents.find((event) =>
                event.name.includes(
                    otherPrize.replace(
                        new RegExp('S([0-9]+)', 'gm'),
                        'Season $1'
                    )
                )
            ) : undefined;

            return {
                place: el.children().eq(1).text(),
                prize: el.find('.prize').first().text() || undefined,
                qualifiesFor,
                otherPrize: !qualifiesFor ? otherPrize : undefined,
                team: el.find('.team').children().exists() ? {
                    name: el.find('.team a').text(),
                    id: el.find('.team a').attrThen('href', getIdAt(2))
                } : undefined
            };
        });

        const numberOfTeams = $('td.teamsNumber').numFromText()!;

        const teams = $('.team-box').toArray().map((el) => {
            if (!el.find('.team-name a').exists()) {
                return null;
            };

            return {
                name: el.find('.logo').attr('title'),
                id: Number(el.find('.team-name a').attrThen('href', getIdAt(2))),
                reasonForParticipation: el.find('.sub-text').trimText(),
                rankDuringEvent: parseNumber(
                    el.find('.event-world-rank').text().replace('#', '')
                )
            };
        }).filter(notNull);

        const formats = $('.formats tr').toArray().map((el) => ({
            type: el.find('.format-header').text(),
            description: el.find('.format-data').text().split('\n').join(' ').trim()
        }));

        const mapPool = $('.map-pool-map-holder').toArray().map((el) => fromMapName(el.find('.map-pool-map-name').text()))

        const highlights = $('.highlight-video').toArray().map((el) => {
            const name = el.find('.video-discription-text').text();
            const link = el.data('mp4-url');

            const [thumbnailBase] = el.data('thumbnail').split('-preview-');
            const thumbnail = `${thumbnailBase}-preview.jpg`;

            const team1Name = el.find('.video-team').first().find('.video-team-img').first().attr('title');
            const team1 = teams.find((x) => x.name === team1Name);

            const team2Name = el.find('.video-team').last().find('.video-team-img').first().attr('title');
            const team2 = teams.find((x) => x.name === team2Name);

            const views = Number(el.find('.thumbnail-view-count').text().split(' ')[0]);

            return {
                name,
                link,
                thumbnail,
                team1: { id: team1?.id, name: team1?.name ?? team1Name },
                team2: { id: team2?.id, name: team2?.name ?? team2Name },
                views
            };
        });

        const news = $('.news .item').toArray().map((el) => ({
            name: el.find('.flag-align .text-ellipsis').text(),
            link: el.find('a').attr('href')
        }));

        return {
            id,
            name,
            logo,
            dateStart,
            dateEnd,
            prizePool,
            location,
            numberOfTeams,
            teams,
            prizeDistribution: prizeDistribution as FullEventPrizeDistribution[],
            relatedEvents: relatedEvents as Event[],
            formats,
            mapPool,
            highlights,
            news
        };
    };
};