async function testEndpoints() {
  const urls = [
    'https://login.kroton.com.br/',
    'https://login.anhanguera.com/',
    'https://alunodigital.anhanguera.com/pda_anhanguera',
    'https://api.kroton.com.br/v1/auth/login'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'manual'
      });
      console.log(url, '=> Status:', res.status, 'Location:', res.headers.get('location'));
    } catch (e) {
      console.log(url, '=> Error:', e.message);
    }
  }
}

testEndpoints();
