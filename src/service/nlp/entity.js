const MAX_CONFIDENCE = 0.8;
const MAX_CONFIDENCE_BOOKING = 0.5;

export function extractEntity (nlp, entity) {
    let obj = nlp[entity] && nlp[entity][0];
    if (obj && obj.confidence > MAX_CONFIDENCE) {
        return obj.value;
    }
    else if (obj && obj.confidence > MAX_CONFIDENCE_BOOKING && (obj.value === 'booking/random' || obj.value === 'booking/specific')) {
        return obj.value;
    }
    else {
        return null;
    }
};
