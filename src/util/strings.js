/**
 * Utility function to strip padding from text.
 * @param {string} input string to strip
 * @returns {string} stripped string
 */
export function stripPadding (input) {
    return input.replace(/^\s+/, '')
        .replace(/\n\s+/g, ' ');
}
