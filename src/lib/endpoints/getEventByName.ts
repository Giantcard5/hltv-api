import {
    HLTVConfig
} from '../config/configuration';

import {
    FullEvent
} from '../types/getEvent';

import {
    getEvent
} from './getEvent';

export const getEventByName = (config: HLTVConfig) => {
    return async ({ name }: { name: string }): Promise<FullEvent> => {
        try {
            const pageContent = JSON.parse(
                await config.loadPage!(
                    `https://www.hltv.org/search?term=${name}`
                )
            );
            const firstResult = pageContent[0].events[0];

            if (!firstResult) {
                throw new Error(`Event ${name} not found`);
            };

            return getEvent(config)({ id: firstResult.id });
        } catch {
            throw new Error(`Event ${name} not found`);
        };
    };
};