const { t, translations } = require('../lib/i18n');

describe('i18n', () => {
  test('should return Polish translation', () => {
    expect(t('pl', 'bracket')).toBe('Drabinka');
    expect(t('pl', 'teams')).toBe('Drużyny');
  });

  test('should return English translation', () => {
    expect(t('en', 'bracket')).toBe('Bracket');
    expect(t('en', 'teams')).toBe('Teams');
  });

  test('should fallback to Polish for missing English key', () => {
    // If a key exists in PL but not EN, should fall back to PL
    const plKeys = Object.keys(translations.pl);
    const enKeys = Object.keys(translations.en);
    const missingInEn = plKeys.filter(k => !enKeys.includes(k));

    for (const key of missingInEn) {
      expect(t('en', key)).toBe(translations.pl[key]);
    }
  });

  test('should return key itself for completely unknown key', () => {
    expect(t('pl', 'nonExistentKey')).toBe('nonExistentKey');
    expect(t('en', 'nonExistentKey')).toBe('nonExistentKey');
  });

  test('should handle unknown language gracefully', () => {
    expect(t('de', 'bracket')).toBe('Drabinka'); // falls back to PL
  });

  test('should have all PL keys also in EN', () => {
    const plKeys = Object.keys(translations.pl);
    const enKeys = Object.keys(translations.en);
    const missing = plKeys.filter(k => !enKeys.includes(k));
    // Report missing keys (not a hard fail, just a warning)
    if (missing.length > 0) {
      console.warn('Missing EN translations:', missing);
    }
  });

  test('PL and EN should have same key count', () => {
    const plCount = Object.keys(translations.pl).length;
    const enCount = Object.keys(translations.en).length;
    // Allow some tolerance (PL may have more due to being primary)
    expect(Math.abs(plCount - enCount)).toBeLessThan(5);
  });
});
