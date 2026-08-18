async function inspectLoginAnhanguera() {
  try {
    const res = await fetch('https://login.anhanguera.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Final URL:', res.url);
    console.log('Cookies:', res.headers.get('set-cookie'));
    
    // Look for form or scripts
    const formMatch = text.match(/<form[\s\S]*?<\/form>/gi);
    console.log('Forms found:', formMatch);

    // Look for script endpoints
    const scriptMatches = text.match(/<script[^>]*src=[\"']([^\"']+)[\"']/gi);
    console.log('Scripts:', scriptMatches);
  } catch (e) {
    console.error('Error:', e);
  }
}

inspectLoginAnhanguera();
