const { sanitize, isValidUrl } = require('../lib/sanitize');

describe('sanitize', () => {
  test('should escape HTML tags', () => {
    expect(sanitize('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('should escape double quotes and remove event handlers', () => {
    const result = sanitize('" onmouseover="alert(1)"');
    expect(result).not.toContain('onmouseover');
    expect(result).toContain('&quot;');
  });

  test('should escape single quotes and remove event handlers', () => {
    const result = sanitize("' onclick='alert(1)'");
    expect(result).not.toContain('onclick');
    expect(result).toContain('&#39;');
  });

  test('should remove javascript: protocol', () => {
    expect(sanitize('javascript:alert(1)')).toBe('alert(1)');
  });

  test('should remove javascript: case insensitive', () => {
    expect(sanitize('JavaScript:alert(1)')).toBe('alert(1)');
    expect(sanitize('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  test('should remove event handlers', () => {
    // on\w+= regex removes the handler part, leaving the value
    expect(sanitize('onload=alert(1)')).not.toContain('onload');
    expect(sanitize('onclick=evil()')).not.toContain('onclick');
    expect(sanitize('onerror=hack()')).not.toContain('onerror');
  });

  test('should trim whitespace', () => {
    expect(sanitize('  hello  ')).toBe('hello');
  });

  test('should return empty string for non-string input', () => {
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
    expect(sanitize(123)).toBe('');
    expect(sanitize({})).toBe('');
  });

  test('should pass through normal text unchanged', () => {
    expect(sanitize('Hello World')).toBe('Hello World');
    expect(sanitize('GG WP 🏆')).toBe('GG WP 🏆');
  });

  test('should handle complex XSS attempts', () => {
    const xss = '<img src=x onerror=alert(1)>';
    const result = sanitize(xss);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
  });

  test('should handle nested XSS', () => {
    const nested = '<<script>>alert(1)<</script>>';
    const result = sanitize(nested);
    expect(result).not.toContain('<script>');
  });
});

describe('isValidUrl', () => {
  test('should accept http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  test('should accept https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  test('should accept empty/null URLs', () => {
    expect(isValidUrl('')).toBe(true);
    expect(isValidUrl(null)).toBe(true);
    expect(isValidUrl(undefined)).toBe(true);
  });

  test('should reject javascript: URLs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  test('should reject data: URLs', () => {
    expect(isValidUrl('data:text/html,<h1>XSS</h1>')).toBe(false);
  });

  test('should reject vbscript: URLs', () => {
    expect(isValidUrl('vbscript:msgbox')).toBe(false);
  });

  test('should reject plain text', () => {
    expect(isValidUrl('not a url')).toBe(false);
  });

  test('should handle case insensitive protocols', () => {
    expect(isValidUrl('HTTPS://EXAMPLE.COM')).toBe(true);
    expect(isValidUrl('JAVASCRIPT:alert(1)')).toBe(false);
  });
});
