async function testRealOlimpoAuth(login, senha) {
  try {
    const url = 'https://olimpo-api-br.kroton.com.br/loginapi/api/v2/Autenticacao';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': '54eabefa0d5f4fc2927b3444049abf22',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://login.anhanguera.com',
        'Referer': 'https://login.anhanguera.com/'
      },
      body: JSON.stringify({
        login: login,
        senha: senha
      })
    });

    console.log('Status:', res.status);
    const data = await res.text();
    console.log('Response:', data);

  } catch (e) {
    console.error('Error:', e);
  }
}

// Test with fake data first to see if it responds with 401/400
testRealOlimpoAuth('00851895298', 'senhatesteerrada');
